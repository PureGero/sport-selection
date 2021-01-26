const DEFAULTS = require('./config.default.js');

module.exports = Object.assign({...DEFAULTS}, {
  // Copy keys from config.default.json into here to change them
  title: 'Test Site'
});
