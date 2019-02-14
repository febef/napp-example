
const WebApp = require("../011Server/Class/WebApp.js");

class WebApp1 extends WebApp {
  events() {

    // endpoint rest: index /
    this.on('rest/', (req) => {
        req.res("hola" + req.rest.req.url);
    });

    // hook all /users/**
    this.on('All/users/**', (req) => {
        if (req.next) req.next();
    });

    // endpoind rest: users/:ids 
    this.on('rest/users/:ids', ( req ) => {
      req.res(JSON.stringify(req.getData()));
    })
  }
}

module.exports = WebApp1;
