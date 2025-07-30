const tagServices = {
  addTag: async ({ id, name, color, level, parentId }) => {
    const parentIdValue = parentId ? parentId : "NULL";
    return sqlQuery(
      `INSERT INTO tag (user_id, parent_id, tag_name,color,level) 
       VALUES (${id}, ${parentIdValue}, '${name}', '${color}', ${level})`
    );
  },

  getTags: async (id) => {
    return sqlQuery(`SELECT * FROM tag WHERE user_id = ${id}`);
  },

  updateTag: async ({ tagId, name, color }) => {
    return sqlQuery(
      `UPDATE tag SET tag_name = '${name}', color = '${color}' WHERE tag_id = ${tagId}`
    );
  },

  // 递归删除标签及其所有子标签
  deleteTagRecursive: async ({ tagId, userId, conn }) => {
    // 1. 先查出所有子标签
    const [children] = await conn.execute(
      `SELECT tag_id FROM tag WHERE parent_id = ? AND user_id = ?`,
      [tagId, userId]
    );

    // 2. 递归删除子标签
    for (const child of children) {
      await tagServices.deleteTagRecursive(child.tag_id, userId, conn);
    }

    // 3. 删除当前标签与交易的关联
    await conn.execute(`DELETE FROM transaction_tag WHERE tag_id = ?`, [tagId]);

    // 4. 删除当前标签本身
    const [res] = await conn.execute(
      `DELETE FROM tag WHERE tag_id = ? AND user_id = ?`,
      [tagId, userId]
    );

    return res;
  },
};
module.exports = tagServices;
