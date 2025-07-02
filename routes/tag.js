var express = require("express");
var router = express.Router();
const tagController = require("../controllers/tag");

router.post("/add", tagController.addTag);
router.get("/list", tagController.getTags);
router.post("/update", tagController.updateTag);
router.post("/delete", tagController.deleteTag);

module.exports = router;
