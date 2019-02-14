
const { nappComponent } = require('n-app');

class Server extends nappComponent {

  constructor(n) {
    super(n);

    if (this.n().config.server.mongodb)
      this.dependencies.push('MongoDB');

    this.express = require('express');
    this.app = this.express();
    this.server = require("http").Server(this.app);

    if (this.n().config.server.socketio) {
      this.sio = require("socket.io")(this.server);
      this.passportSocketIo = require("passport.socketio");
    }

    this.path = require("path");
    this.esession = require("express-session");

    if (this.n().config.server.mongodb)
      this.MongoStrore = require("connect-mongo")(this.esession);

    this.morgan = require("morgan");
    this.compression = require("compression");
    this.cookieparser = require("cookie-parser");
    this.bodyparser = require("body-parser");
    this.helmet = require("helmet");
    this.Emitter = require('eventemitter2').EventEmitter2;
    this.esys = new this.Emitter(this.n().config.server.events);

    if (this.n().config.server.mongodb) {
      this.sessionStore = new this.MongoStrore({
        ...this.n().config.server.mongoStore,
        mongooseConnection: this.gc('MongoDB').mongoose.connection
      });

      this.session = this.esession({
        ...this.n().config.server.session,
        store: this.sessionStore
      });
    } else {
      this.session = this.esession(this.n().config.server.session);
    }

    if (this.n().config.server.mongodb)
      this.app.set("DB", this.gc("MongoDB"));
    if (this.n().config.server.mongodb)
      this.app.set("session", this.sessionStore);
    this.app.set("server", this.server);

    //this.app.set('views',  path.join(__dirname, "./views"));
    //this.app.set('view engine', 'pug');
    //this.app.use('/', express.static(path.join(__dirname, "./public")));

    this.app.use(this.bodyparser.json());
    this.app.use(this.bodyparser.urlencoded(this.n().config.server.bodyparser));
    this.app.use(this.cookieparser());
    this.app.use(this.session);
    this.app.use(this.morgan(this.n().config.server.morgan));
    this.app.use(this.compression());
    this.app.use(this.helmet());

    if (this.n().config.server.passport) {
      this.log("Setting up passport")
      require("./passport")(this.app);
    }

    if (this.n().config.server.socketio) {
      this.log("Setting up Socket.io");
      this.app.set("sio", this.sio);
      this.sio.use(this.passportSocketIo.authorize({
        ...this.n().config.server.passport,
        store: this.sessionStore,
        passport: this.app.get("passport"),
        cookieParser: this.cookieparser
      }));
    }

  }

  innerComunication({sourceType, socket, session, event, data, req, res, next}) {
    let request, event2, params;
    switch (sourceType) {
      case 'socket':
        event2 = 'socket/' + event;
        request = {
          socket: {socket, io:this.sio, event},
          session,
          data
        };

        break;
      case 'rest' :
        event2 = 'rest' + req.url;
        request = {
          rest: {req, res, next},
          session: req.session,
          data: {
            o_params: req.params,
            body : req.body
          }
        };
        break;
      default:
        this.log('Comunicacion no reconocible');
    }

    let event3 = event ? ('All/' + event) : 'All' + req.url;

    request['event'] = {id: event2, taked: false, _next: (this.n().config.server.events.priorityAll ? event2 : event3)};
    request['sourceType'] = sourceType;
    request['res'] = this.outerComunication.apply(this, [request]);

    this.esys.emit((this.n().config.server.events.priorityAll)? event3 : event2, request);
    this.esys.emit((this.n().config.server.events.priorityAll)? event2 : event3, request);

  }

  outerComunication(req) {
    return (data, type ='json') => {
      switch (req.sourceType) {
        case 'socket':
          switch (type) {
            case json:
                return req.socket.sio.to(socket.id).emit(req.event, data);
              break;
            default:
          }
          break;
        case 'rest':
          const res = req.rest.res;
          if (res.headerSent) return;
          switch (type) {
            case 'json':
              res.json(data);
              break;
            case 'text':
              res.send(data);
            default:

          }
        default:
          return {};
      }
    }
  }

  run() {

    if (this.n().config.socketio) {
      this.sio.on("connection", (socket) => {
        let onevent = socket.onevent;
        socket.onevent = function(packet) {
          var args = packet.data || [];
          onevent.call (this, packet);             // original call
          emit.apply   (this, ["*"].concat(args)); // additional call to catch-all
        };
        socket.on("*", (e, data) => {
          this.session.get(socket.request.sessionID, (err, session) => {
            this.innerComunication({sourceType: 'socket', event, socket, session, data});
          });
        });
      });
    }

    this.app.use((req, res, next) => {
      this.innerComunication({sourceType: 'rest', req, res, next});
    });

    this.server.listen(this.n().config.server.port, () => {
      this.log('listening in port:', this.n().config.server.port);
    });
  }
}

module.exports = Server;