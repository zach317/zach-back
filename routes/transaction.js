var express = require("express");
var router = express.Router();
const transactionController = require("../controllers/transaction");

router.get("/list", transactionController.getTransactionList);
router.post("/add", transactionController.addTransaction);
router.post("/update", transactionController.updateTransaction);
router.post("/delete", transactionController.deleteTransaction);

module.exports = router;
