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

  getCategoryRadio: async ({ userId, type }) => {
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
    WHERE c.user_id = ?
    AND c.category_type = ?
    GROUP BY c.category_id, c.parent_id, c.category_name, c.level, c.category_type
    `;
    return await sqlQuery(sql, [userId, type, userId, type]);
  },
};

module.exports = analysisServices;
