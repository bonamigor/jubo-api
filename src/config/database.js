const mysql = require('mysql2');

require('dotenv').config();

try {
  const connection = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    connectionLimit: 10,
    queueLimit: 80,
  });

  module.exports = connection;
} catch (error) {
  console.log(error);
}
