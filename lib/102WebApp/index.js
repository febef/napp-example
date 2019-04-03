
const WebApp = require("../../share/Class/WebApp.js");

class WebApp2 extends WebApp {
  events() {

    // endpoint rest: index /
    this.on('rest/**', (req) => {
      req.res("hola2" + req.rest.req.url);
    });

    // hook all /users/**
    this.on('All/**', (req) => {
      this.log("otra app");
      if (req.next) req.next();
    });

    // endpoind rest: users
    this.on('rest/users2', ( req ) => {
      req.res("ALL USERS! doswsp!");
    });

  }
}

module.exports = WebApp2;
