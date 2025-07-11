const transactionServices = require("../services/transaction");
const { selectSql } = require("../utils/helpers");
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
      id: tx.categories,
      name: tx.category_name,
      type: tx.type,
    };

    const amount = Number(tx.amount);

    result[date].transactions.push({
      id: tx.transaction_id,
      amount,
      category,
      tags: tx.tags ? tx.tags.split(", ") : [],
      note: tx.description,
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

    const formattedData = groupTransactionsByDate(data[0]);
    const sortedArray = Object.entries(formattedData)
      .sort((a, b) => dayjs(b[0]).unix() - dayjs(a[0]).unix()) // 日期倒序
      .map(([date, data]) => ({
        date,
        ...data,
      }));

    const countSql = await transactionServices.countSql(userId, filters);
    const { total, totalIncome, totalExpense } = selectSql(countSql) || {};
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
};

module.exports = transactionController;
