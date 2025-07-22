const analysisServices = require("../services/analysis");
const dayjs = require("dayjs");

const generateColor = (() => {
  const colorList = [
    "#F56C6C",
    "#67C23A",
    "#409EFF",
    "#E6A23C",
    "#909399",
    "#1abc9c",
    "#9b59b6",
    "#34495e",
    "#e67e22",
    "#e74c3c",
    "#2ecc71",
    "#3498db",
  ];
  const cache = new Map();
  let index = 0;

  return (key) => {
    if (!cache.has(key)) {
      cache.set(key, colorList[index % colorList.length]);
      index++;
    }
    return cache.get(key);
  };
})();

/**
 * 1. 如果节点没有子节点且 amount 为 0，直接过滤掉；
 * 2. 如果节点有子节点，先递归处理子节点；处理完后若子节点为空且自身 amount 为 0，则过滤掉；
 * 3. 若节点保留，amount 取「自身 amount + 所有子节点 amount 之和」。
 */
function buildCategoryTree(data, parentId = null) {
  const children = data.filter((item) => item.parent_id === parentId);

  return children
    .map((parent) => {
      const childNodes = buildCategoryTree(data, parent.category_id);
      const selfAmount = parseFloat(parent.amount || 0);

      // 计算所有子节点的 amount 总和
      const childTotal = childNodes.reduce((sum, c) => sum + c.amount, 0);

      // 当前节点最终 amount
      const total = selfAmount + childTotal;

      // 如果自己和子节点都为 0，则过滤
      if (total === 0) return null;

      return {
        name: parent.name,
        amount: total,
        category_id: parent.category_id,
        color: generateColor(parent.name),
        // 只有存在子节点时才挂 children
        ...(childNodes.length > 0 && { children: childNodes }),
      };
    })
    .filter(Boolean); // 去掉被过滤的 null
}

const analysisController = {
  getIncomeAndExpense: async (req, res) => {
    try {
      const { id: userId } = req.body;
      const {
        startDate = dayjs().subtract(29, "day").format("YYYY-MM-DD"),
        endDate = dayjs().format("YYYY-MM-DD"),
      } = req.query;

      const result = await analysisServices.getIncomeAndExpense({
        userId,
        startDate,
        endDate,
      });
      res.send({ success: true, data: result });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  getCategoryRadio: async (req, res) => {
    try {
      const { id: userId } = req.body;

      const { type = "expense" } = req.query; // 支持收入 or 支出
      const data = await analysisServices.getCategoryRadio({ userId, type });
      const result = buildCategoryTree(data);
      res.send({ success: true, data: result });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = analysisController;
