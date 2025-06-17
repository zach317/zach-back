## 初始化项目配置指南

### 创建 Express 项目
官方文档：[Express Generator](https://www.expressjs.com.cn/starter/generator.html)

修改模板引擎为 EJS：
```bash
npx express-generator --view=ejs
```

### 启动服务
使用 `node-dev` 实现热重载：
```json
// package.json
"scripts": {
  "start": "node-dev ./bin/www"
}
```

### 数据库连接 (MySQL)
1. 安装依赖：
```bash
npm install mysql2 --save
```

2. 创建数据库连接池配置：
```js
// config/db.config.js
const mysql = require("mysql2");

// 创建连接池配置
function dbConfig() {
  return {
    host: "127.0.0.1",
    user: "root",
    password: "123456789",
    database: "zach_db",
    port: 3306,
    connectionLimit: 1
  };
}

// 初始化连接池
const promisePool = mysql.createPool(dbConfig()).promise();

// 全局 SQL 查询方法
const sqlQuery = async (sql) => await promisePool.query(sql);

// 挂载全局对象
global.sqlQuery = sqlQuery;

module.exports = sqlQuery;
```

3. 引入配置：
```js
// bin/www
require("../config/db.config");
```
