var express = require("express");
var router = express.Router();
const transactionController = require("../controllers/transaction");

router.get("/list", transactionController.getTransactionList);

module.exports = router;
