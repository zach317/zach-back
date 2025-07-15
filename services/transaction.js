const dayjs = require("dayjs");
const { sanitizeParams } = require("../utils/helpers");
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

    const offset = (page - 1) * pageSize;

    const sql = `
    SELECT 
    t.transaction_id,
    t.type,
    t.amount,
    t.transaction_date,
    t.description,
    c.category_id,
    c.category_name,
    (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('id', tg.tag_id, 'name', tg.tag_name, 'color', tg.color))
    FROM transaction_tag tt
    JOIN tag tg ON tt.tag_id = tg.tag_id
    WHERE tt.transaction_id = t.transaction_id
    ) AS tags
     FROM transaction t
     LEFT JOIN category c ON t.category_id = c.category_id
     WHERE ${whereConditions}
     ${tagFilter}
     AND DATE(t.transaction_date) IN (
     SELECT DATE(t2.transaction_date)
     FROM (
     SELECT DISTINCT DATE(transaction_date) AS transaction_date
     FROM transaction t2
     WHERE ${buildWhereConditions(userId, filters, "t2")}
     ${buildTagFilter(filters, "t2")}
     ORDER BY transaction_date DESC
     LIMIT ${offset}, ${pageSize}
     ) AS t2
      )
     ORDER BY t.transaction_date DESC
  `;

    const rows = await sqlQuery(sql);
    return rows;
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

  addTransaction: async ({
    userId,
    type,
    amount,
    transactionDate,
    description,
    categoryId,
    tags,
    createDate,
  }) => {
    return await withTransaction(async (connection) => {
      const insertTransactionSql = `
          INSERT INTO transaction (user_id, category_id, amount, transaction_date, description, type, create_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
      const [result] = await connection.execute(
        insertTransactionSql,
        sanitizeParams([
          userId,
          categoryId,
          amount,
          transactionDate,
          description,
          type,
          createDate,
        ])
      );

      const transactionId = result.insertId;

      if (tags && tags.length > 0) {
        const placeholders = tags.map(() => "(?, ?)").join(", ");
        const tagParams = tags.flatMap((tag) => [transactionId, tag.id]);

        const insertTagsSql = `
          INSERT INTO transaction_tag (transaction_id, tag_id)
          VALUES ${placeholders}
        `;
        await connection.execute(insertTagsSql, tagParams);
      }

      return transactionId;
    });
  },

  updateTransaction: async ({
    userId,
    type,
    amount,
    transactionDate,
    description,
    categoryId,
    tags,
    updateDate,
    transactionId,
  }) => {
    return await withTransaction(async (connent) => {
      const updateSql = `
        UPDATE transaction
        SET category_id = ?, amount = ?, transaction_date = ?, description = ?, type = ?,update_date = ?
        WHERE transaction_id = ? AND user_id = ?
      `;
      const [result] = await connent.execute(updateSql, [
        categoryId,
        amount,
        transactionDate,
        description,
        type,
        updateDate,
        transactionId,
        userId,
      ]);
      console.log("🚀 ~ returnawaitwithTransaction ~ result:", result);

      // 2. 删除旧的标签
      const deleteTagsSql = `DELETE FROM transaction_tag WHERE transaction_id = ?`;
      await connent.execute(deleteTagsSql, [transactionId]);

      // 3. 插入新的标签
      if (tags && tags.length > 0) {
        const placeholders = tags.map(() => "(?, ?)").join(", ");
        const tagParams = tags.flatMap((tag) => [transactionId, tag.id]);
        const insertTagsSql = `
          INSERT INTO transaction_tag (transaction_id, tag_id)
          VALUES ${placeholders}
        `;
        await connent.execute(insertTagsSql, tagParams);
      }

      return transactionId;
    });
  },

  deleteTransaction: async ({ transactionId, userId }) => {
    return await withTransaction(async (connent) => {
      // 先校验该记录是否属于该用户（防止误删）
      const [checkRows] = await connent.execute(
        "SELECT transaction_id FROM transaction WHERE transaction_id = ? AND user_id = ?",
        [transactionId, userId]
      );

      if (checkRows.length === 0) {
        throw new Error("该交易不存在或不属于当前用户");
      }

      // 显式删除标签关联（可省略，外键 ON DELETE CASCADE 会自动处理）
      await connent.execute(
        "DELETE FROM transaction_tag WHERE transaction_id = ?",
        [transactionId]
      );

      // 删除交易记录
      await connent.execute(
        "DELETE FROM transaction WHERE transaction_id = ? AND user_id = ?",
        [transactionId, userId]
      );

      return transactionId;
    });
  },
};

module.exports = transactionServices;
