
const WebApp = require("../011Server/Class/WebApp.js");

class WebApp1 extends WebApp {
  events() {

  this.on('rest/', (req) => {
      req.res("hola" + req.rest.req.url);
  });

  this.on('All/users/**', (req) => {
    setTimeout(() => {
      this.log({uno:1, dos: 2});
      if (req.next) req.next();
    }, 20);
  });
  this.on('rest/users/:ids', ( req ) => {
    req.res(JSON.stringify(req.data));
  })




  }
}

module.exports = WebApp1;
