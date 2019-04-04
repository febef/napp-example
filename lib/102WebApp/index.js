
const WebApp = require("../../share/Class/WebApp.js");

class WebApp2 extends WebApp {
  events() {



    // hook all /users/**
    this.on('All/**', (req) => {
      this.log("otra app");
      this.continue(req);
    });
    // endpoint rest: index /
    this.on('rest/**', (req) => {
      req.res("hola2" + req.rest.req.url);
        this.continue(req);
    });
    // endpoind rest: users
    this.on('rest/users', ( req ) => {
      req.res("ALL USERS! doswsp!");
    });

  }
}

module.exports = WebApp2;
