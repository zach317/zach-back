为了方便维护，可以将路由内容、创建路由以及服务端基本结构分离。通过分层设计，提高代码可维护性和可读性。

### 分层说明及示例

#### Router 层（路由层）

用于定义应用程序的路由，并关联相应的控制器。

```javascript
// 示例：router/userRouter.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/users", userController.createUser);

module.exports = router;
```

#### Controller 层（控制器层）

用于处理请求和返回响应。

```javascript
// 示例：controllers/userController.js
const userService = require("../services/userService");

const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    const newUser = await userService.addUser({ name, email });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
};

module.exports = {
  createUser,
};
```

#### Service 层 / Model 层（业务逻辑与数据操作层）

用于定义数据模型和具体的数据操作逻辑，包括数据库连接。

```javascript
// 示例：services/user.js
const userServices = {
  createUser: (body) => {
    const { name,email } = body;
    return sqlQuery(
      `INSERT INTO user ( name,email) VALUES ('${name}','${email}')`
    );
  },
};

module.exports = userServices;
```

---

通过这种分层方式，你的 Node.js 应用程序将具有良好的可扩展性和清晰的职责分工。
