
const WebApp = require("../../share/Class/WebApp.js");

class WebApp1 extends WebApp {
  events() {

    // endpoint rest: index /
    this.on('rest/', (req) => {
      req.res("hola" + req.rest.req.url);
    });

    // hook all /users/**
    this.on('All/users/**', (req) => {
      this.log("otros");
      if (req.next) req.next();
    });

    // endpoind rest: users
    this.on('rest/users', ( req ) => {
      req.res("ALL USERS!");
    });

    // endpoind rest: users/:ids
    this.on('rest/users/:ids', ( req ) => {
      req.res(JSON.stringify(req.getData()));
    });

    // optional parameter
    this.on('rest/da/:ids/:toke?', ( req ) => {
      req.res(JSON.stringify(req.getData()));
    });

    // double parameter
    this.on('rest/travel/:from-:to', ( req ) => {
      req.res(JSON.stringify(req.getData()));
    });

    // props parameter
    this.on('rest/1jump3/:id/setname/:name/:coco?', ( req ) => {
      req.res(JSON.stringify(req.getData()));
    });

  }
}

module.exports = WebApp1;
