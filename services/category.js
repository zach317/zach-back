const categoryServices = {
  // 获取用户的分类列表
  getCategories: (userId, type) => {
    let sql = `SELECT * FROM category WHERE user_id = ${userId}`;
    if (type) {
      sql += ` AND category_type = '${type}'`;
    }
    sql += ` ORDER BY level ASC, category_id ASC`;
    return sqlQuery(sql);
  },

  // 根据key获取分类信息
  getCategoryByKey: (key) => {
    const categoryId = key.split("-").pop();
    return sqlQuery(`SELECT * FROM category WHERE category_id = ${categoryId}`);
  },

  // 根据ID获取分类信息
  getCategoryById: (categoryId) => {
    return sqlQuery(`SELECT * FROM category WHERE category_id = ${categoryId}`);
  },

  // 添加分类
  addCategory: ({ userId, parentId, categoryName, categoryType, level }) => {
    const parentIdValue = parentId ? parentId : "NULL";
    return sqlQuery(
      `INSERT INTO category (user_id, parent_id, category_name, category_type, level) 
       VALUES (${userId}, ${parentIdValue}, '${categoryName}', '${categoryType}', ${level})`
    );
  },

  // 更新分类信息
  updateCategory: ({ categoryId, userId, categoryName, categoryType }) => {
    return sqlQuery(
      `UPDATE category 
       SET category_name = '${categoryName}', category_type = '${categoryType}'
       WHERE category_id = ${categoryId} AND user_id = ${userId}`
    );
  },

  // 删除分类
  deleteCategory: (categoryId, userId) => {
    return sqlQuery(
      `DELETE FROM category 
       WHERE category_id = ${categoryId} AND user_id = ${userId}`
    );
  },

  // 检查是否有子分类
  hasChildCategories: (categoryId) => {
    return sqlQuery(
      `SELECT category_id FROM category WHERE parent_id = ${categoryId} LIMIT 1`
    );
  },

  // 递归删除分类及其所有子分类
  // 删除当前分类及所有子分类，同时删除对应交易记录和标签
  deleteCategoryRecursive: async (categoryId, userId, conn) => {
    // 1. 查询该分类下所有交易
    const [transactions] = await conn.execute(
      `SELECT transaction_id FROM transaction WHERE category_id = ? AND user_id = ?`,
      [categoryId, userId]
    );

    const transactionIds = transactions.map((tx) => tx.transaction_id);

    if (transactionIds.length > 0) {
      const placeholders = transactionIds.map(() => "?").join(", ");

      // 2. 删除标签关联
      await conn.execute(
        `DELETE FROM transaction_tag WHERE transaction_id IN (${placeholders})`,
        transactionIds
      );

      // 3. 删除交易记录
      await conn.execute(
        `DELETE FROM transaction WHERE transaction_id IN (${placeholders})`,
        transactionIds
      );
    }

    // 4. 查询所有子分类
    const [children] = await conn.execute(
      `SELECT category_id FROM category WHERE parent_id = ? AND user_id = ?`,
      [categoryId, userId]
    );

    for (const child of children) {
      await categoryServices.deleteCategoryRecursive(
        child.category_id,
        userId,
        conn
      );
    }

    // 5. 删除当前分类
    const [deleteResult] = await conn.execute(
      `DELETE FROM category WHERE category_id = ? AND user_id = ?`,
      [categoryId, userId]
    );

    return deleteResult;
  },

  // 更新分类的父级和层级（用于拖拽排序）
  updateCategoryParent: async ({ categoryId, userId, parentId, level }) => {
    const parentIdValue = parentId ? parentId : "NULL";

    // 更新当前分类
    const result = await sqlQuery(
      `UPDATE category 
       SET parent_id = ${parentIdValue}, level = ${level}
       WHERE category_id = ${categoryId} AND user_id = ${userId}`
    );

    // 递归更新所有子分类的层级
    await categoryServices.updateChildrenLevel(categoryId, level);

    console.log("🚀 ~ updateCategoryParent: ~ result:", result)
    return result;
  },

  // 获取分类的完整路径（用于显示分类层级关系）
  getCategoryPath: async (categoryId) => {
    const path = [];
    let currentId = categoryId;

    while (currentId) {
      const result = await sqlQuery(
        `SELECT category_id, parent_id, category_name FROM category WHERE category_id = ${currentId}`
      );

      if (result[0].length > 0) {
        const category = result[0][0];
        path.unshift(category.category_name);
        currentId = category.parent_id;
      } else {
        break;
      }
    }

    return path;
  },

  // 检查分类名称是否重复（同一用户、同一父级下）
  checkCategoryNameDuplicate: (
    userId,
    categoryName,
    categoryType,
    parentId = null,
    excludeId = null
  ) => {
    let sql = `SELECT category_id FROM category 
               WHERE user_id = ${userId} 
               AND category_name = '${categoryName}' 
               AND category_type = '${categoryType}'`;

    if (parentId) {
      sql += ` AND parent_id = ${parentId}`;
    } else {
      sql += ` AND parent_id IS NULL`;
    }

    if (excludeId) {
      sql += ` AND category_id != ${excludeId}`;
    }

    sql += ` LIMIT 1`;

    return sqlQuery(sql);
  },

  // 获取用户的分类统计信息
  getCategoryStats: (userId) => {
    return sqlQuery(`
      SELECT 
        category_type,
        level,
        COUNT(*) as count
      FROM category 
      WHERE user_id = ${userId}
      GROUP BY category_type, level
      ORDER BY category_type, level
    `);
  },

  // 递归更新子分类的层级
  updateChildrenLevel: async (parentId, newLevel) => {
    // 获取所有子分类
    const children = await sqlQuery(
      `SELECT category_id FROM category WHERE parent_id = ${parentId}`
    );

    for (const child of children) {
      const childNewLevel = newLevel + 1;

      // 检查层级限制
      if (childNewLevel > 3) {
        throw new Error("操作会导致分类层级超过3层，无法完成");
      }

      // 更新子分类层级
      await sqlQuery(
        `UPDATE category SET level = ${childNewLevel} WHERE category_id = ${child.category_id}`
      );

      // 递归更新更深层的子分类
      await categoryServices.updateChildrenLevel(
        child.category_id,
        childNewLevel
      );
    }
  },
};

module.exports = categoryServices;
