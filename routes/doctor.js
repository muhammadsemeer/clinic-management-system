var express = require("express");
var router = express.Router();

router.get("/", (req, res) => {
  res.render("doctor/index", {title: "Doctor Dashboard"});
});

module.exports = router;
