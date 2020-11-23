var express = require("express");
var router = express.Router();
const adminHelpers = require("../helpers/admin-helpers");
const jwt = require("jsonwebtoken");
require("dotenv").config();
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("admin/index", { title: "Dashboard", admin: true });
});

router.get("/login", async (req, res) => {
  res.render("admin/login", { title: "Admin Login" });
});

router.post("/login", async (req, res) => {
  adminHelpers
    .doLogin(req.body)
    .then((response) => {
      var token = jwt.sign(response, process.env.JWT_SECERT);
      res.cookie("adminToken", token, { expiresIn: 60 });
      res.redirect("/");
    })
    .catch((error) => {
      console.log(error.msg);
    });
});

module.exports = router;
