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
  deleteTagRecursive: async (tagId, userId) => {
    // 先获取所有子标签
    const children = await sqlQuery(
      `SELECT tag_id FROM tag WHERE parent_id = ${tagId} AND user_id = ${userId}`
    );

    // 递归删除子标签
    for (const child of children[0]) {
      await tagServices.deleteTagRecursive(child.tag_id, userId);
    }

    // 删除当前标签
    return sqlQuery(
      `DELETE FROM tag WHERE tag_id = ${tagId} AND user_id = ${userId}`
    );
  },
};
module.exports = tagServices;
