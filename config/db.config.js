const mysql = require("mysql2");
const config = dbConfig();
const promisePool = mysql.createPool(config).promise();

const sqlQuery = async (sql) => await promisePool.query(sql);

function dbConfig() {
  return {
    host: "127.0.0.1",
    user: "root",
    password: "123456789",
    database: "zach_db",
    port: 3306,
    connectionLimit: 1,
  };
}

global.sqlQuery = sqlQuery;

module.exports = sqlQuery;
