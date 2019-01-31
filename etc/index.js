
const fs = require('fs');

fs
  .readdirSync(__dirname)
  .filter(file => file.slice(-4) == 'json')
  .forEach(file => {
    module.exports[file.slice(0,-5)] = require(__dirname + '/' + file);
})
