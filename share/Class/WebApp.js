const { nappComponent } = require("n-app");
const pathToRegexp = require('path-to-regexp')

class WebApp extends nappComponent {
  constructor(n) {
    super({...n, dependencies: ['Server']});

    this.e = this.gc('Server').esys;
    this.routes = {};
  }

  on(eventName, callback) {
    this._on(eventName, callback);
    this._on(eventName, callback, false);
  }

  _on(eventName, callback, addend=true) {
    // if rest
    let rest = (eventName.slice(0, 4) === 'rest');
    let route = {};
    let ifparams = false;
    if (rest) {
      let sRoute = eventName.slice(4);
      // regexpr match if url params
      let parts = pathToRegexp.parse(sRoute);
      let baseUrl = ( p => {
        let url = '';
        for (let i = 0; i < p.length; i++)
        if (!p[i].name) url += p[i];
        else { ifparams = true; break; }
        return url;
      })(parts);

      if (baseUrl.slice(-1) !== '/' && addend) baseUrl += '/';
      if (baseUrl[0] !== '/') baseUrl = '/'+baseUrl;

      route = this.routes[eventName] = {
        regexp: pathToRegexp(sRoute),
        baseUrl: 'rest' + baseUrl + (ifparams ? '**' : ''),
        parts
      };
    }

    this.e.on((rest)? route.baseUrl : eventName, (req) => {
      let pfields = (route.regexp) ? route.regexp.exec(req.rest.req.url) : null;
      if (rest && pfields) {
        req.data['params'] = {};
        req.baseUrl = route.baseUrl;

        //let argumentIndex = 1;

        for (let i = 0, argumentIndex = 1; i < route.parts.length; i++) {
          if (route.parts[i].name) {
            req.data['params'][route.parts[i].name] = pfields[argumentIndex];
            argumentIndex ++;
          }
        }
      }

      if (!req.event.taked) {
        req.event.taked = true;
        req['next'] = () => {
          req.event.taked = false;
          this.e.emit(req.event._next, req);
        };
        if ((ifparams && JSON.stringify(req.getData()) !== "{}") || !ifparams)
          if (!this.approbedSecurity(req)) this.notHavePermissions(req);
          else callback(req);
        else {
          this.notFoundError(req);
        }
      }
    });
  }

  run() {

    this.e.on("**" , (req) => { setTimeout(() => {
        if (!req.event.taked) {
          this.notFoundError(req);
        } else { if (req.rest) req.rest.next();}
      }, 0);
    });

    this.events();
  }

  approbedSecurity(req) {

    return true;
  }

  notFoundError(req) {
    let menssage = "Cannot GET " + JSON.stringify(req.event.id);
    req.event.taked = true;
    if (req.rest && !req.res.headerSent)
      req.rest.res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>Error</title>
          </head>
          <body>
            <pre>${menssage}</pre>
          </body>
        </html>
      `);
    else
      req.res(menssage);
  }

  notHavePermissions(req) {
    let menssage = "You do not have permissions for " + JSON.stringify(req.event.id);
    req.event.taked = true;
    if (req.rest && !req.res.headerSent)
      req.rest.res.status(401).send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <title>Error</title>
            </head>
            <body>
              <pre>${menssage}</pre>
            </body>
          </html>
        `);
    else
      req.res(menssage);
  }

  events() {}
}

module.exports = WebApp;
