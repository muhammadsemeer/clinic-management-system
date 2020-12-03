var express = require("express");
var router = express.Router();

router.get("/", (req, res) => {
  res.render("user/index", {
    user: true,
    title: "Galaxieon Care",
    header: true,
  });
});

module.exports = router;