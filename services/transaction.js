const dayjs = require("dayjs");
const buildWhereConditions = (userId, filters = {}, alias = "t") => {
  const prefix = alias ? `${alias}.` : "";
  const conditions = [`${prefix}user_id = ${userId}`];

  // 类型筛选
  if (filters.type) {
    conditions.push(`${prefix}type = '${filters.type}'`);
  }

  // 金额范围筛选
  if (filters.amount && filters.amount.length === 2) {
    const [minAmount, maxAmount] = filters.amount;
    conditions.push(`${prefix}amount BETWEEN ${minAmount} AND ${maxAmount}`);
  }

  // 日期范围筛选
  if (filters.dateRange && filters.dateRange.length === 2) {
    const [startRaw, endRaw] = filters.dateRange;
    const startDate = dayjs(startRaw).format("YYYY-MM-DD");
    const endDate = dayjs(endRaw).format("YYYY-MM-DD");
    conditions.push(
      `DATE(${prefix}transaction_date) BETWEEN '${startDate}' AND '${endDate}'`
    );
  }

  // 分类筛选
  if (filters.categories && filters.categories.length > 0) {
    const categoryIds = filters.categories.map((id) => `'${id}'`).join(",");
    conditions.push(`${prefix}category_id IN (${categoryIds})`);
  }

  // 描述模糊搜索
  if (filters.description) {
    conditions.push(`${prefix}description LIKE '%${filters.description}%'`);
  }

  return conditions.join(" AND ");
};

// 封装的标签筛选构建器
const buildTagFilter = (filters = {}, alias = "t") => {
  if (!filters.tags || filters.tags.length === 0) {
    return "";
  }

  const prefix = alias ? `${alias}.` : "";
  const tagIds = filters.tags.map((id) => `'${id}'`).join(",");
  return `AND ${prefix}transaction_id IN (
    SELECT tt.transaction_id 
    FROM transaction_tag tt 
    WHERE tt.tag_id IN (${tagIds})
  )`;
};

const transactionServices = {
  getTransactionList: async ({ userId, page, pageSize, filters = {} }) => {
    const whereConditions = buildWhereConditions(userId, filters, "t");
    const tagFilter = buildTagFilter(filters, "t");

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
    ${whereConditions}
    ${tagFilter}
    AND DATE(t.transaction_date) IN (
        SELECT DATE(t2.transaction_date)
        FROM (
            SELECT DISTINCT DATE(transaction_date) AS transaction_date
            FROM transaction t2
            WHERE ${buildWhereConditions(userId, filters, "t2")}
            ${buildTagFilter(filters, "t2")}
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

  countSql: async (userId, filters = {}) => {
    // 在countSql中不使用别名，所以传入空字符串
    const whereConditions = buildWhereConditions(userId, filters, "");
    const tagFilter = buildTagFilter(filters, "");

    return sqlQuery(`SELECT 
    COUNT(DISTINCT DATE(transaction_date)) AS total,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpense
  FROM transaction
  WHERE ${whereConditions}
  ${tagFilter}`);
  },
};

module.exports = transactionServices;
