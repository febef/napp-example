
const path = require('path');
const fs   = require('fs');
const basedir = path.join(__dirname ,process.env.ENV || 'dev');
fs
  .readdirSync(basedir)
  .filter(file => file.slice(-4) == 'json')
  .forEach(file => {
    module.exports[file.slice(0,-5)] =
      require(path.join(basedir, file));
})
