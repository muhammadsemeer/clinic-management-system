var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
var router = express.Router();

router.get("/", (req, res) => {
  adminHelpers.getDoctors().then((response) => {
    res.render("user/index", {
      user: true,
      title: "Galaxieon Care",
      header: true,
      doctor: response,
    });
  });
});

router.get("/signup", (req, res) => {
  res.render("user/signup", { title: "Create An Account" });
});

module.exports = router;
