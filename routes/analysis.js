var express = require("express");
var router = express.Router();
const analysisController = require("../controllers/analysis");

router.get("/income-and-expense", analysisController.getIncomeAndExpense);
router.get("/category-radio", analysisController.getCategoryRadio);

module.exports = router;
