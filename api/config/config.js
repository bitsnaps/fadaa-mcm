// Load .env for development and .env.production for production
require('dotenv').config({ path: process.env.NODE_ENV=='production'?'.env.prod' :'.env' });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql'
  },
  test: {
    "storage": ":memory:",
    dialect: 'sqlite'
  }
};