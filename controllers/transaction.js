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
      id: tx.category_id,
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
    const { page, pageSize } = req.query;
    const data = await transactionServices.getTransactionList({
      userId,
      page,
      pageSize,
    });

    const formattedData = groupTransactionsByDate(data[0]);
    const sortedArray = Object.entries(formattedData)
      .sort((a, b) => dayjs(b[0]).unix() - dayjs(a[0]).unix()) // 日期倒序
      .map(([date, data]) => ({
        date,
        ...data,
      }));

    const countSql = await transactionServices.countSql(userId);
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
