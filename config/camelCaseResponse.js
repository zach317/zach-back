const humps = require("humps");

// 中间件：将响应数据的键名从下划线转换为驼峰命名
const camelCaseResponse = (req, res, next) => {
  // 拦截响应事件
  const originalSend = res.send;
  res.send = (data) => {
    if (data && typeof data === "object") {
      // 转换数据为驼峰命名
      const camelCasedData = humps.camelizeKeys(data);
      // 调用原始的send方法
      originalSend.call(res, camelCasedData);
    } else {
      // 如果不是对象，直接调用原始的send方法
      originalSend.call(res, data);
    }
  };
  // 继续执行下一个中间件
  next();
};

module.exports = camelCaseResponse;
