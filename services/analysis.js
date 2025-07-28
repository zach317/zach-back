const analysisServices = {
  getIncomeAndExpense: async ({ userId, startDate, endDate }) => {
    const sql = `
      SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM \`transaction\`
      WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m-%d')
      ORDER BY date
    `;
    return await sqlQuery(sql, [userId, startDate, endDate]);
  },

  getCategoryRadio: async ({ userId, type, startDate, endDate }) => {
    const params = [userId, type];
    let timeCondition = "";

    if (startDate && endDate) {
      timeCondition = `AND DATE(t.transaction_date) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    const sql = `
    SELECT 
      c.category_id,
      c.parent_id,
      c.category_name AS name,
      c.level,
      c.category_type,
      IFNULL(SUM(t.amount), 0) AS amount
    FROM category c
    LEFT JOIN transaction t 
      ON t.category_id = c.category_id 
      AND t.user_id = ? 
      AND t.type = ?
      ${timeCondition}
    WHERE c.user_id = ?
      AND c.category_type = ?
    GROUP BY c.category_id, c.parent_id, c.category_name, c.level, c.category_type
  `;

    params.push(userId, type); // 对应 WHERE c.user_id=? AND c.category_type=?

    return await sqlQuery(sql, params);
  },

  getCategoryRank: async ({ userId, limit, type, startDate, endDate }) => {
    const params = [userId, type];

    let dateCondition = "";
    if (startDate && endDate) {
      dateCondition = "AND t.transaction_date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    const sql = `
    SELECT 
      c.category_type AS type,
      c.category_name AS name,
      SUM(t.amount) AS amount
    FROM \`transaction\` t
    JOIN category c ON t.category_id = c.category_id
    WHERE t.user_id = ? AND c.category_type = ? ${dateCondition}
    GROUP BY c.category_id
    ORDER BY amount DESC
    LIMIT ${Number(limit)}
  `;

    return await sqlQuery(sql, params);
  },

  getMonthAmount: async ({ userId, startDate, endDate }) => {
    const sql = `
    SELECT
      DATE(t.transaction_date) AS date,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE NULL END) AS income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE NULL END) AS expense
    FROM \`transaction\` t
    WHERE t.user_id = ?
      AND t.transaction_date BETWEEN ? AND ?
    GROUP BY DATE(t.transaction_date)
    ORDER BY DATE(t.transaction_date)
  `;

    return await sqlQuery(sql, [userId, startDate, endDate]);
  },
};

module.exports = analysisServices;
