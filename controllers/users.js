const userServices = require("../services/users");
const JWT = require("../utils/jwt");
const dayjs = require("dayjs");

const userController = {
  register: async (req, res) => {
    try {
      req.body.createAt = dayjs().format("YYYY-MM-DD HH:mm:ss");
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
      const nameRes = data[0];
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
      if (data.length) {
        const { username, id } = data[0];
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
      const { username, id, gender, birth, nickname } = data[0];
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

  updateUserInfo: async (req, res) => {
    req.body.updateAt = dayjs().format("YYYY-MM-DD HH:mm:ss");
    try {
      const data = await userServices.updateUserInfo(req.body);
      if (data) {
        res.send({ success: true, message: "更新成功" });
      }
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },

  getSecurityQuestions: async (_, res) => {
    try {
      const data = await userServices.getSecurityQuestions();
      res.send({ success: true, data });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },

  getUserSecurityQuestion: async (req, res) => {
    const userId = req.body.id || req.query.unAuthorizationId;
    try {
      const data = await userServices.getUserSecurityQuestion(userId);
      res.send({ success: true, data });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },

  verifySimpleQuestion: async (req, res) => {
    const { id: userId, type, answer, unAuthorizationId } = req.body;
    try {
      const data = await userServices.verifySimpleQuestion({
        userId: userId || unAuthorizationId,
        type,
        answer,
      });
      res.send({
        success: data,
      });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },

  verifySecurityQuestion: async (req, res) => {
    const { id: userId, answer, unAuthorizationId } = req.body;
    try {
      const data = await userServices.verifySecurityQuestion({
        userId: userId || unAuthorizationId,
        answer,
      });
      res.send({
        success: data,
      });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },

  verifyCustomQuestion: async (req, res) => {
    const { id: userId, question, answer, unAuthorizationId } = req.body;
    try {
      const data = await userServices.verifyCustomQuestion({
        userId: userId || unAuthorizationId,
        question,
        answer,
      });
      res.send({
        success: data,
      });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },

  findUser: async (req, res) => {
    try {
      const data = await userServices.findUser(req.body.username);
      if (!!data) {
        res.send({
          success: true,
          data,
        });
      }
      res.send({
        success: false,
      });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  },
};

module.exports = userController;
