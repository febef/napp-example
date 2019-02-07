
const { nappComponent } = require("n-app");

class WebApp extends nappComponent {
  constructor(n) {
    super({...n,
      dependencies: ['Server'],
      app: this.gc('Server').app,
      get: this.gc('Server').app.get,
      sio: this.gc('Server').app.get("sio"),
      eio: this.gc('Server').app.get("esys"),
       db: this.gc('Server').app.get("MongoDB")
    });
  }

  run() {
    let get = this.get;
    // index
    get("/", (req, res) => {
      // authentication verification
      if(req.user) res.json({ page:"index" });
      else res.json({ page:"login", data: "hola mundo!" });
    });

    this.log('Ready.');
  }
}

module.exports = WebApp;
