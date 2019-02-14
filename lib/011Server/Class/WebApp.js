const { nappComponent } = require("n-app");
const pathToRegexp = require('path-to-regexp')

class WebApp extends nappComponent {
  constructor(n) {
    super({...n, dependencies: ['Server'], _or: false});

    this.e = this.gc('Server').esys;
    this.routes = {};
  }

  on(eventName, callback) {
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

      if (baseUrl.slice(-1) !== '/') baseUrl += '/';
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

        for (let i = 0; i < pfields.length; i++) if (route.parts[i].name)
          req.data['params'][route.parts[i].name] = pfields[i];
      }

      if (req.event.taked) {
        req['next'] = () =>  {
          req.event.taked = false;
          this.e.emit(req.event._next, req);
        }
      } else {
        req.event.taked = true;
        callback(req);
      }
    });
  }

  run() {

    this.e.on("**" , (req) => setTimeout(() => {
      if (!req.event.taked) this.notFoundError(req);
      else { if (req.rest) req.rest.next();}
    }, 50));

    this.events();
  }

  notFoundError(req) {
    let menssage = 'not found';
    req.event.taked = true;
    if (req.rest && !req.res.headerSent)
      req.rest.res.status(404).send(menssage);
    else
      req.res(menssage);
  }
  events() {}
}

module.exports = WebApp;
