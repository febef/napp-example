
const { nappComponent } = require("n-app");

const fs = require("fs");
const path = require("path");

const loadModels = function(sPath, napp){
  fs
  .readdirSync(sPath)
  .filter( file => file.indexOf(".") !== 0 && file.slice(-3) === ".js" )
  .forEach( file => {
    napp.log("     loading model :", file.slice(0,-3));
    this[file.slice(0, -3)] = require(path.join(sPath, file))(napp.n());
  });
}

class MongoDB extends nappComponent {

  constructor(n){
    super(n);
    this.mongoose = require("mongoose");

    fs
      .readdirSync(path.join(__dirname, "../"))
      .filter( partial => partial.indexOf(".") !== 0)
      .forEach( partial => {
        let sPath = path.join(__dirname, "../", partial, "./models");
        if (fs.existsSync(sPath)){
          this.log("loading models of [" + partial + "]");
          loadModels.apply(this, [sPath, this]);
        }
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
