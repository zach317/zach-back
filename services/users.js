const userServices = {
  register: (body) => {
    const {
      username,
      password,
      gander,
      birth,
      nickname,
      createAt,
      securityNumber,
      securityLetter,
      securityQuestionId,
      security_answer,
      customQuestion,
      customAnswer,
    } = body;

    const sql = `
    INSERT INTO user (
      username,
      password,
      gender,
      birth,
      nickname,
      create_at,
      security_number,
      security_letter,
      security_question_id,
      security_answer,
      custom_question,
      custom_answer
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    return sqlQuery(sql, [
      username,
      password,
      gander,
      birth,
      nickname,
      createAt,
      securityNumber,
      securityLetter,
      securityQuestionId,
      security_answer,
      customQuestion,
      customAnswer,
    ]);
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

  // 获取安全问题列表
  getSecurityQuestions: () => {
    return sqlQuery(
      "SELECT * FROM security_questions WHERE is_active = 1 ORDER BY id"
    );
  },
};

module.exports = userServices;
