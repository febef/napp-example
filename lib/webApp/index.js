
const { nappComponent } = require("n-app");

class WebApp extends nappComponent {
  constructor(n) {
    super(n);
    this.dependencies.push('Server');
  }

  run(){
    let r = this.n().components['Server'].app;
    r.get("/", (req, res) => {
      if(req.user) res.json({page:"index"});
      else res.json({page:"login", data: "hola mundo!"})
    });

    this.log('Ready.');
  }

}

module.exports = WebApp;
