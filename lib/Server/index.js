
const { nappComponent } = require('n-app');

class Server extends nappComponent {

  constructor(n) {
    super(n);

    this.dependencies.push('MongoDB');

    this.express = require('express');
    this.app = this.express();
    this.server = require("http").Server(this.app);

    this.sio = require("socket.io")(this.server);
    this.passportSocketIo = require("passport.socketio");

    this.path = require("path");

    this.esession = require("express-session");
    this.MongoStrore = require("connect-mongo")(this.esession);

    this.morgan = require("morgan");
    this.compression = require("compression");
    this.cookieparser = require("cookie-parser");
    this.bodyparser = require("body-parser");
    this.helmet = require("helmet");

    this.Emitter = require('events').EventEmitter;
    this.emit = this.Emitter.prototype.emit;
    this.esys = new this.Emitter();

    this.sessionStore = new this.MongoStrore({
      ...this.n().config.server.mongoStore,
      mongooseConnection: this.n().components['MongoDB'].mongoose.connection
    });

    this.session = this.esession({
      ...this.n().config.server.session,
      store: this.sessionStore
    });

    this.app.set("DB", this.n().components["MongoDB"]);
    this.app.set("session", this.sessionStore);
    this.app.set("sio", this.sio);
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

    require("./passport")(this.app);

    this.sio.use(this.passportSocketIo.authorize({
      ...this.n().config.server.passport,
      store: this.sessionStore,
      passport: this.app.get("passport0"),
      cookieParser: this.cookieparser
    }));

    this.sio.on("connection", (socket) => {

      let onevent = socket.onevent;
      socket.onevent = function(packet) {
        var args = packet.data || [];
        onevent.call (this, packet);             // original call
        emit.apply   (this, ["*"].concat(args)); // additional call to catch-all
      };

      socket.on("*", (e, data) => {
        this.esys.emit(e, {socket: socket, data: data});
      });

    })

  }

  run(){
    this.server.listen(3000, () => {
      this.log('listening in port:', this.n().config.server.port);
    });
  }
}

module.exports = Server;
