const mysql = require("mysql2");
const config = dbConfig();

const pool = mysql.createPool(config).promise();

// 默认单条查询（无事务）
const sqlQuery = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// 提供事务支持
const withTransaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

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
global.withTransaction = withTransaction;

module.exports = { sqlQuery, withTransaction };
