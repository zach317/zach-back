// 构建树形结构的辅助函数
function buildCategoryTree(categories) {
  const categoryMap = {};
  const tree = [];

  // 先创建所有节点的映射
  categories.forEach((category) => {
    const key = `${category.category_type}-${category.category_id}`;
    categoryMap[category.category_id] = {
      key,
      title: category.category_name,
      level: category.level,
      children: [], // 初始化children为空数组
    };
  });

  // 构建树形结构
  categories.forEach((category) => {
    const node = categoryMap[category.category_id];

    if (category.parent_id === null) {
      // 根节点
      tree.push(node);
    } else {
      // 子节点
      const parent = categoryMap[category.parent_id];
      if (parent && parent.level === category.level - 1) {
        // 确保层级关系正确
        parent.children.push(node);
      } else {
        console.warn(
          `Invalid parent-child relationship for category_id ${category.category_id}`
        );
      }
    }
  });

  // 如果children为空，删除children属性
  const cleanTree = (nodes) => {
    return nodes.map((node) => {
      const cleanNode = { ...node };
      if (cleanNode.children && cleanNode.children.length > 0) {
        cleanNode.children = cleanTree(cleanNode.children);
      } else {
        delete cleanNode.children; // 删除空的children属性
      }
      return cleanNode;
    });
  };

  return cleanTree(tree);
}

function sanitizeParams(params) {
  return params.map((p) => (p === undefined ? null : p));
}

module.exports = {
  buildCategoryTree,
  sanitizeParams,
};
