// backend/src/config/db.config.js
const config = require('./env');

module.exports = {
  user: config.db.user,
  password: config.db.password,
  server: config.db.server,
  database: config.db.database,
  options: config.db.options
};