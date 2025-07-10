const transactionServices = {
  getTransactionList: async ({ userId, page, pageSize }) => {
    return sqlQuery(`SELECT 
    t.transaction_id,
    t.type,
    t.amount,
    t.transaction_date,
    c.category_name,
    c.category_id,
    GROUP_CONCAT(DISTINCT tg.tag_name SEPARATOR ', ') AS tags,
    t.description
FROM 
    transaction t
LEFT JOIN 
    category c ON t.category_id = c.category_id
LEFT JOIN 
    transaction_tag tt ON t.transaction_id = tt.transaction_id
LEFT JOIN 
    tag tg ON tt.tag_id = tg.tag_id
WHERE 
    t.user_id = ${userId}
    AND DATE(t.transaction_date) IN (
        SELECT DATE(t2.transaction_date)
        FROM (
            SELECT DISTINCT DATE(transaction_date) AS transaction_date
            FROM transaction
            WHERE user_id = ${userId}
            ORDER BY transaction_date DESC
            LIMIT ${(page - 1) * pageSize}, ${pageSize}
        ) AS t2
    )
GROUP BY 
    t.transaction_id
ORDER BY 
    t.transaction_date DESC;
`);
  },

  countSql: async (userId) => {
    return sqlQuery(`SELECT 
    COUNT(DISTINCT DATE(transaction_date)) AS total,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpense
  FROM transaction
  WHERE user_id = ${userId}`);
  },
};

module.exports = transactionServices;
