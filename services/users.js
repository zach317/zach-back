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

  // 获取用户安全问题
  getUserSecurityQuestion: async (userId) => {
    const rows = await sqlQuery(
      `SELECT q.question
     FROM user u
     JOIN security_questions q ON u.security_question_id = q.id
     WHERE u.id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  // 验证简单问题的答案
  verifySimpleQuestion: async ({ userId, type, answer }) => {
    const column = type === "number" ? "security_number" : "security_letter";
    const rows = await sqlQuery(
      `SELECT ${column} AS val FROM user WHERE id = ?`,
      [userId]
    );
    if (!rows.length) return false;
    return String(rows[0].val) === String(answer);
  },

  verifySecurityQuestion: async ({ userId, answer }) => {
    const rows = await sqlQuery(
      `SELECT security_answer FROM user WHERE id = ?`,
      [userId]
    );
    if (!rows.length) return false;
    return rows[0].security_answer === answer;
  },

  verifyCustomQuestion: async ({ userId, question, answer }) => {
    const rows = await sqlQuery(
      `SELECT custom_question, custom_answer FROM user WHERE id = ?`,
      [userId]
    );
    if (!rows.length) return false;
    return (
      rows[0].custom_question === question && rows[0].custom_answer === answer
    );
  },
};

module.exports = userServices;
