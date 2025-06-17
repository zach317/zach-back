const categoryServices = require("../services/category");
const { buildCategoryTree, selectSql } = require("../utils/helpers");
const dayjs = require("dayjs");

const getTreeList = async (id, type) => {
  const data = await categoryServices.getCategories(id, type);
  const categories = data[0];

  // 构建树形结构
  return buildCategoryTree(categories);
};

const categoryController = {
  // 获取分类列表（按类型）
  getCategories: async (req, res) => {
    const { id: userId } = req.body;
    const { type } = req.query; // 'income' or 'expense'

    try {
      const tree = await getTreeList(userId, type);

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

  // 添加分类
  addCategory: async (req, res) => {
    const { id: userId, title, type, parentKey, level } = req.body;

    try {
      // 验证层级限制
      if (level > 3) {
        return res.status(400).send({
          success: false,
          message: "分类层级不能超过3层",
        });
      }

      // 解析parentKey获取parent_id
      let parentId = null;
      if (parentKey) {
        const parentCategory = await categoryServices.getCategoryByKey(
          parentKey
        );
        if (parentCategory[0].length > 0) {
          parentId = parentCategory[0][0].category_id;
        }
      }

      const categoryData = {
        userId,
        parentId,
        categoryName: title,
        categoryType: type,
        level: level || 1,
      };

      const result = await categoryServices.addCategory(categoryData);

      if (result[0].affectedRows > 0) {
        res.send({
          success: true,
          message: "添加成功",
          data: {
            category_id: result[0].insertId,
            key: `${type}-${result[0].insertId}`,
          },
        });
      } else {
        throw new Error("添加失败");
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  // 更新分类
  updateCategory: async (req, res) => {
    const { id: userId, key, title, type } = req.body;
    try {
      // 从key中解析category_id
      const categoryId = key.split("-").pop();

      const result = await categoryServices.updateCategory({
        categoryId,
        userId,
        categoryName: title,
        categoryType: type,
      });

      if (result[0].affectedRows > 0) {
        const tree = await getTreeList(userId, type);
        res.send({
          success: true,
          message: "更新成功",
          data: tree,
        });
      } else {
        throw new Error("修改失败，分类不存在或无权限");
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  // 删除分类
  deleteCategory: async (req, res) => {
    const { id: userId, key, type } = req.body;

    try {
      // 从key中解析category_id
      const categoryId = key.split("-").pop();

      // 调用递归删除方法
      const result = await categoryServices.deleteCategoryRecursive(
        categoryId,
        userId
      );

      if (result[0].affectedRows > 0) {
        const tree = await getTreeList(userId, type);
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

  // 重新排序分类（拖拽）
  reorderCategory: async (req, res) => {
    const {
      id: userId,
      dragKey,
      dropKey,
      dropPosition,
      dropToGap,
      type,
    } = req.body;

    try {
      const dragId = dragKey.split("-").pop();
      const dropId = dropKey.split("-").pop();

      // 获取目标分类信息
      const dropCategory = await categoryServices.getCategoryById(dropId);
      if (dropCategory[0].length === 0) {
        throw new Error("目标分类不存在");
      }

      const targetCategory = dropCategory[0][0];
      let newParentId = null;
      let newLevel = 1;

      if (dropToGap) {
        // 移动到同级
        newParentId = targetCategory.parent_id;
        newLevel = targetCategory.level;
      } else {
        // 移动到子级
        newParentId = targetCategory.category_id;
        newLevel = targetCategory.level + 1;

        if (newLevel > 3) {
          return res.status(400).send({
            success: false,
            message: "分类层级不能超过3层",
          });
        }
      }

      const result = await categoryServices.updateCategoryParent({
        categoryId: dragId,
        userId,
        parentId: newParentId,
        level: newLevel,
      });

      if (result[0].affectedRows > 0) {
        const tree = await getTreeList(userId, type);
        res.send({
          success: true,
          message: "移动成功",
          data: tree,
        });
      } else {
        throw new Error("移动失败");
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = categoryController;
