const tagServices = require("../services/tag");

// 构建树形结构的辅助函数
function buildTagTree(categories) {
  const categoryMap = {};
  const tree = [];

  // 先创建所有节点的映射
  categories.forEach((tag) => {
    categoryMap[tag.tag_id] = {
      id: tag.tag_id,
      name: tag.tag_name,
      level: tag.level,
      color: tag.color,
      children: [], // 初始化children为空数组
    };
  });

  // 构建树形结构
  categories.forEach((tag) => {
    const node = categoryMap[tag.tag_id];

    if (tag.parent_id === null) {
      // 根节点
      tree.push(node);
    } else {
      // 子节点
      const parent = categoryMap[tag.parent_id];
      if (parent && parent.level === tag.level - 1) {
        // 确保层级关系正确
        parent.children.push(node);
      } else {
        console.warn(
          `Invalid parent-child relationship for tag_id ${tag.tag_id}`
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

const getTreeList = async (id) => {
  const data = await tagServices.getTags(id);
  const tags = data;

  // 构建树形结构
  return buildTagTree(tags);
};

const tagController = {
  // 新增标签
  addTag: async (req, res) => {
    const { id } = req.body;
    const result = await tagServices.addTag(req.body);
    if (result[0].affectedRows > 0) {
      try {
        const tree = await getTreeList(id);

        res.send({
          success: true,
          message: "添加成功",
          data: tree,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    } else {
      throw new Error("添加失败");
    }
  },

  // 查询标签
  getTags: async (req, res) => {
    const { id } = req.body;
    try {
      const tree = await getTreeList(id);

      res.send({
        success: true,
        data: tree,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  // 修改标签
  updateTag: async (req, res) => {
    const { id, tagId, name, color } = req.body;
    const result = await tagServices.updateTag({ tagId, name, color });
    if (result[0].affectedRows > 0) {
      try {
        const tree = await getTreeList(id);

        res.send({
          success: true,
          message: "更新成功",
          data: tree,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    } else {
      throw new Error("更新z失败");
    }
  },

  // 删除标签
  deleteTag: async (req, res) => {
    const { id: userId, tagId } = req.body;

    try {
      // 调用递归删除方法
      const result = await tagServices.deleteTagRecursive(tagId, userId);

      if (result[0].affectedRows > 0) {
        const tree = await getTreeList(userId);
        res.send({
          success: true,
          message: "删除成功",
          data: tree,
        });
      } else {
        throw new Error("删除失败，分类不存在或无权限");
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = tagController;
