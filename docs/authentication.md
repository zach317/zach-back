## 登陆鉴权

使用 `jsonwebtoken` 与前端 `crypto` 结合，实现用户登陆鉴权。

### 安装 jsonwebtoken

```bash
npm install jsonwebtoken --save
```

### 创建 jwt.js 文件，用于生成和验证 Token

路径：[utils/jwt.js](../utils/jwt.js)

```javascript
const jwt = require("jsonwebtoken");

const secret = "zach-key";

const JWT = {
  // 生成 Token
  generate: (data, expires) => jwt.sign(data, secret, { expiresIn: expires }),

  // 验证 Token
  verify: (token) => {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return false;
    }
  },
};

module.exports = JWT;
```

### 配置鉴权中间件 authentication

路径：[config/authentication.js](../config/authentication.js)

```javascript
const JWT = require("../utils/jwt");

const excludeUrl = []; // 白名单 URL（无需鉴权）

const authentication = (req, res, next) => {
  // 如果当前请求在白名单中，直接放行
  if (excludeUrl.includes(req.url)) {
    next();
    return;
  }

  // 从 header 中提取 token
  const token = req.headers["authorization"]?.split(" ")[1];

  if (token) {
    const payload = JWT.verify(token);

    if (payload) {
      // Token 有效，刷新 token 并继续
      const { username, id } = payload;
      const newToken = JWT.generate({ username, id }, "1h");
      res.header("Authorization", newToken); // 返回新 token
      req.body = { ...req.body, id }; // 将用户 ID 注入到请求体中
      next();
      return;
    }

    // Token 无效，返回未授权错误
    res.status(401).send({ success: false, message: "登录超时，请重新登录" });
    return;
  }

  // 没有 token，继续流程（如开放接口）
  next();
};

module.exports = authentication;
```

在 app.js 中引入并使用中间件：

```javascript
const authentication = require("./config/authentication");
// ...
app.use(authentication);
```
