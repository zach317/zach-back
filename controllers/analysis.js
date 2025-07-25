const analysisServices = require("../services/analysis");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

const generateColor = (() => {
  const colorList = [
    "#1f77b4", // 亮蓝
    "#ff7f0e", // 暖橙
    "#2ca02c", // 草绿
    "#d62728", // 鲜红
    "#9467bd", // 紫罗兰
    "#8c564b", // 棕
    "#e377c2", // 玫红
    "#bcbd22", // 黄绿
    "#17becf", // 青

    "#aec7e8", // 淡蓝
    "#ffbb78", // 淡橙
    "#98df8a", // 淡绿
    "#ff9896", // 淡红
    "#c5b0d5", // 淡紫
    "#c49c94", // 淡棕
    "#f7b6d3", // 淡玫
    "#c7c7c7", // 淡灰
    "#dbdb8d", // 淡黄绿
    "#9edae5", // 淡青
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

      const { type = "expense", startDate, endDate } = req.query; // 支持收入 or 支出
      const data = await analysisServices.getCategoryRadio({
        userId,
        type,
        startDate,
        endDate,
      });
      const result = buildCategoryTree(data);
      res.send({ success: true, data: result });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  getCategoryRank: async (req, res) => {
    try {
      const { id: userId } = req.body;
      const { limit = 8 } = req.query;
      const rows = await analysisServices.getCategoryRank({ userId, limit });
      const result = { income: [], expense: [] };
      for (const row of rows) {
        const { type, name, amount } = row;
        result[type].push({
          name,
          amount: Number(amount),
          color: generateColor(name),
        });
      }

      res.send({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  getMonthAmount: async (req, res) => {
    try {
      const today = dayjs();
      const { id: userId } = req.body;
      const { year = today.year(), month = today.month() + 1 } = req.query;
      const targetMonth = dayjs(
        `${year}-${month.toString().padStart(2, "0")}-01`
      );
      const startDate = targetMonth.startOf("month").format("YYYY-MM-DD");
      const endDate = targetMonth.endOf("month").format("YYYY-MM-DD");

      const rows = await analysisServices.getMonthAmount({
        userId,
        startDate,
        endDate,
      });
      const formatted = rows.map((item) => ({
        ...item,
        date: dayjs.utc(item.date).local().format("YYYY-MM-DD"),
      }));

      const amountMap = new Map();
      formatted.forEach((row) => {
        const dateKey = dayjs(row.date).local().format("YYYY-MM-DD"); // 修复关键点
        amountMap.set(dateKey, [
          dateKey,
          row.income !== null ? Number(row.income) : null,
          row.expense !== null ? Number(row.expense) : null,
        ]);
      });

      const result = [];
      let cursor = targetMonth.startOf("month");
      const lastDay = targetMonth.endOf("month");

      while (cursor.isBefore(lastDay.add(1, "day"))) {
        const d = cursor.format("YYYY-MM-DD");
        result.push(amountMap.get(d) || [d, null, null]);
        cursor = cursor.add(1, "day");
      }

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
