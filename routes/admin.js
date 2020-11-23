var express = require("express");
var router = express.Router();
const adminHelpers = require("../helpers/admin-helpers");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyLogin = (req, res, next) => {
  if (req.cookies.adminToken) {
    jwt.verify(
      req.cookies.adminToken,
      process.env.JWT_SECERT,
      (error, decoded) => {
        if (error) {
          return res.redirect("/login");
        } else {
          req.admin = decoded;
          next();
        }
      }
    );
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", verifyLogin, function (req, res, next) {
  res.render("admin/index", { title: "Dashboard", admin: true });
});

router.get("/login", async (req, res) => {
  res.render("admin/login", { title: "Admin Login" });
});

router.post("/login", async (req, res) => {
  adminHelpers
    .doLogin(req.body)
    .then((response) => {
      delete response.password;
      var token = jwt.sign(response, process.env.JWT_SECERT, { expiresIn: 60 });
      res.cookie("adminToken", token);
      res.redirect("/");
    })
    .catch((error) => {
      console.log(error.msg);
    });
});

module.exports = router;
