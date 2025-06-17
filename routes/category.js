var express = require("express");
var router = express.Router();
const categoryController = require("../controllers/category");

router.get("/list", categoryController.getCategories);
router.post("/add", categoryController.addCategory);
router.post("/update", categoryController.updateCategory);
router.post("/delete", categoryController.deleteCategory);
router.post("/reorder", categoryController.reorderCategory);

module.exports = router;
