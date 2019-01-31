
class Server {

  constructor() {
    this.dependencies = [];
    this.subordinantes = [];
  }

  run(napp) {
    this.log("Starting...");

  }

  stop() {
    this.log("Stoping...");
  }
}

module.exports = new Server();
