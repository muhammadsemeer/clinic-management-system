var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("admin/index", { title: "Dashboard", admin: true });
});

router.get("/login", (req, res) => {
  res.render("admin/login", { title: "Admin Login" });
});

module.exports = router;
