var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
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
  res.render("user/signup", {
    title: "Create An Account",
    error: req.session.signuperr,
  });
  res.session.signuperr = null;
});

router.post("/signup", (req, res) => {
  userHelpers
    .doSignup(req.body)
    .then((response) => {
      res.redirect("/");
    })
    .catch((error) => {
      req.session.signuperr = error.msg;
      res.redirect("/signup");
    });
});

module.exports = router;
