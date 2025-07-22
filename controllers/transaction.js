const transactionServices = require("../services/transaction");
const dayjs = require("dayjs");

const groupTransactionsByDate = (transactions) => {
  const result = {};

  for (const tx of transactions) {
    const date = dayjs(tx.transaction_date).format("YYYY-MM-DD");
    const time = dayjs(tx.transaction_date).format("HH:mm");

    if (!result[date]) {
      result[date] = {
        transactions: [],
        summary: {
          income: 0,
          expense: 0,
          balance: 0,
        },
      };
    }

    const category = {
      key: `${tx.type}-${tx.category_id}`,
      name: tx.category_name,
      type: tx.type,
    };

    const amount = Number(tx.amount);

    // 处理 tags：兼容 null、JSON 字符串、已解析对象
    let tags = [];
    try {
      tags = typeof tx.tags === "string" ? JSON.parse(tx.tags) : tx.tags || [];
    } catch {
      tags = [];
    }

    result[date].transactions.push({
      id: tx.transaction_id,
      amount,
      category,
      tags,
      description: tx.description,
      date,
      time,
      type: tx.type,
    });

    if (tx.type === "income") {
      result[date].summary.income += amount;
    } else if (tx.type === "expense") {
      result[date].summary.expense += Math.abs(amount);
    }

    result[date].summary.balance =
      result[date].summary.income - result[date].summary.expense;
  }

  return result;
};

const transactionController = {
  getTransactionList: async (req, res) => {
    const { id: userId } = req.body;
    const {
      page,
      pageSize,
      transactionType: type,
      amountRange: amount,
      dateRange,
      categories,
      description,
      tags,
    } = req.query;

    // 构建筛选条件
    const filters = {
      type: type && type !== "all" ? type : null,
      amount:
        amount && Array.isArray(amount) && amount.length === 2 ? amount : null,
      dateRange:
        dateRange && Array.isArray(dateRange) && dateRange.length === 2
          ? dateRange
          : null,
      categories:
        categories && Array.isArray(categories) && categories.length > 0
          ? categories.map((item) => {
              const match = item.match(/\d+/);
              return match ? parseInt(match[0], 10) : null;
            })
          : null,
      description: description ? description.trim() : null,
      tags: tags && Array.isArray(tags) && tags.length > 0 ? tags : null,
    };

    const data = await transactionServices.getTransactionList({
      userId,
      page,
      pageSize,
      filters,
    });

    const formattedData = groupTransactionsByDate(data);
    const sortedArray = Object.entries(formattedData)
      .sort((a, b) => dayjs(b[0]).unix() - dayjs(a[0]).unix()) // 日期倒序
      .map(([date, data]) => ({
        date,
        ...data,
      }));

    const countSql = await transactionServices.countSql(userId, filters);
    const { total, totalIncome, totalExpense } = countSql[0] || {};
    res.send({
      success: true,
      data: sortedArray,
      totalStats: {
        total,
        totalIncome,
        totalExpense,
        balance: parseFloat((totalIncome - totalExpense).toFixed(2)),
      },
    });
  },

  addTransaction: async (req, res) => {
    try {
      const {
        id: userId,
        type,
        amount,
        date: transactionDate,
        description,
        category,
        tags,
      } = req.body;
      const createDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
      // 从 category.key 中提取 category_id
      const categoryId = parseInt(category.key.split("-")[1]);

      const transactionId = await transactionServices.addTransaction({
        userId,
        type,
        amount,
        transactionDate,
        description,
        categoryId,
        tags,
        createDate,
      });

      res.send({
        success: true,
        message: "创建成功",
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  updateTransaction: async (req, res) => {
    try {
      const {
        id: userId,
        type,
        amount,
        date: transactionDate,
        description,
        category,
        tags,
        transactionId,
      } = req.body;
      const updateDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
      // 从 category.key 中提取 category_id
      const categoryId = parseInt(category.key.split("-")[1]);
      await transactionServices.updateTransaction({
        userId,
        type,
        amount,
        transactionDate,
        description,
        categoryId,
        tags,
        updateDate,
        transactionId,
      });

      res.send({
        success: true,
        message: "更新成功",
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  deleteTransaction: async (req, res) => {
    try {
      const { id: userId, transactionId } = req.body;

      if (!transactionId || !userId) {
        return res.status(400).send({ success: false, message: "缺少参数" });
      }

      await transactionServices.deleteTransaction({
        transactionId,
        userId,
      });
      res.send({
        success: true,
        message: "删除成功",
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = transactionController;
