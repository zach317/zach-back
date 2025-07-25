var express = require("express");
var router = express.Router();
const analysisController = require("../controllers/analysis");

router.get("/income-and-expense", analysisController.getIncomeAndExpense);
router.get("/category-radio", analysisController.getCategoryRadio);
router.get("/category-rank", analysisController.getCategoryRank);
router.get("/month-amount", analysisController.getMonthAmount);

module.exports = router;
