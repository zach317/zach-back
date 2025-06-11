const userServices = require("../services/users");
const JWT = require("../utils/jwt");
const { selectSql } = require("../utils/helpers");
const dayjs = require('dayjs')


const userController = {
  register: async (req, res) => {
    try {
      const data = await userServices.register(req.body);
      if (data) {
        res.send({
          success: true,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  checkUsername: async (req, res) => {
    const { username } = req.body;
    try {
      const data = await userServices.checkUsername(username);
      const nameRes = selectSql(data);
      if (!!nameRes) {
        res.send({ success: false, message: "用户名已存在" });
        return;
      }
      res.send({ success: true });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },

  login: async (req, res) => {
    const values = req.body;
    try {
      const data = await userServices.login(values);
      if (data[0].length) {
        const { username, id } = data[0][0];
        const result = {
          username,
          id,
        };
        const token = JWT.generate(result, "1h");
        res.header("Authorization", token);
        res.send({ success: true, data: id });
        return;
      }
      res.send({ success: false, message: "用户名或密码错误" });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },

  getUserInfo: async (req, res) => {
    const { id: userId } = req.body;
    try {
      const data = await userServices.getUserinfo(userId);
      const { username, id, gender, birth, nickname } = selectSql(data);
      const birthday = dayjs(birth).valueOf();
      const today = dayjs().valueOf();
      const age = Math.floor(parseInt((today - birthday) / 1000) / 86400 / 365);
      const result = {
        username,
        nickname,
        id,
        gender,
        birth,
        age,
      };
      res.send({ success: true, data: result });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },
};

module.exports = userController;
