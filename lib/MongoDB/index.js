
const { nappComponent } = require("n-app");

const fs = require("fs");
const path = require("path");

class MongoDB extends nappComponent {
  constructor(n){
    super(n);

    this.mongoose = require("mongoose");

    fs
      .readdirSync(path.join(__dirname, "./models"))
      .filter( file => file.indexOf(".") !== 0 && file.slice(-3) === ".js" )
      .forEach( file => {
        this.log("loading model " + file.slice(0,-3) + "...");
        this[file.slice(0, -3)] = require(path.join(__dirname, "./models/", file))(this.n());
      });
  }

  connectMongo() {
    this.mongoose.Promise = global.Promise;
    return this.mongoose
      .connect(this.n().config.MongoDB.url, this.n().config.MongoDB.params)
      .then(() => {
          this.log("Conexion a la base de datos establecida.");
        }, (err) => {
          this.log("Error al conectar con la base de datos!");
          return err;
        });
  }

  run() {
    this.connection = this.connectMongo();
  }
}

module.exports = MongoDB;
