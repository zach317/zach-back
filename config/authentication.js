const JWT = require("../utils/jwt");

const excludeUrl = [
  "/users/login",
  "/users/register",
  "/users/check-username",
  "user/find-user",
];
const authentication = (req, res, next) => {
  if (excludeUrl.includes(req.url)) {
    next();
    return;
  }
  const token = req.headers["authorization"]?.split(" ")[1];
  if (token) {
    const payload = JWT.verify(token);
    if (payload) {
      // 重新计算token过期时间
      const { username, id, exp } = payload;
      const now = Math.floor(Date.now() / 1000);
      let newToken;
      if (exp - now < 600) {
        // 如果少于 10 分钟过期
        newToken = JWT.generate(
          { username: payload.username, id: payload.id },
          "1h"
        );
      } else {
        newToken = JWT.generate({ username, id }, "1h");
      }
      res.header("Authorization", newToken);
      req.body = { ...req.body, id };
      next();
      return;
    }
    // 否则token过期 则返回401
    res.status(401).send({ success: false, message: "登录超时，请重新登陆" });
    return;
  }
  // 没有token也直接返回401
  res.status(401).send({ success: false, message: "登录超时，请重新登陆" });
};

module.exports = authentication;
