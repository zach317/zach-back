const { register } = require("../controllers/users");

const userServices = {
  register: (body) => {
    const { username, password, gander, birth, nickname, createAt } = body;
    return sqlQuery(
      `INSERT INTO user (username,password,gender,birth,nickname,create_at) VALUES ('${username}','${password}','${gander}','${birth}','${nickname}','${createAt}')`
    );
  },

  checkUsername: (username) => {
    return sqlQuery(
      `SELECT username FROM user WHERE username='${username}' LIMIT 1`
    );
  },

  login: ({ username, password }) => {
    return sqlQuery(
      `SELECT * FROM user WHERE username='${username}' AND password='${password}'`
    );
  },

  getUserinfo: (userId) => {
    return sqlQuery(`SELECT * FROM user WHERE id='${userId}'`);
  },

  updateUserInfo: ({ username, nickname, gender, birth, id, updateAt }) => {
    return sqlQuery(
      `UPDATE user SET username='${username}',nickname='${nickname}',gender='${gender}',birth='${birth}',update_at='${updateAt}' WHERE id='${id}' `
    );
  },
};

module.exports = userServices;
