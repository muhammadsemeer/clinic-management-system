var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const loginCheck = (req, res, next) => {
  if (req.cookies.userToken) {
    jwt.verify(
      req.cookies.userToken,
      process.env.JWT_SECERT,
      (error, decoded) => {
        if (error) {
          next();
        } else {
          req.user = decoded;
          next();
        }
      }
    );
  } else {
    next();
  }
};

const tokenCheck = (req, res, next) => {
  if (req.cookies.userToken) {
    jwt.verify(
      req.cookies.userToken,
      process.env.JWT_SECERT,
      (error, decoded) => {
        if (error) {
          next();
          console.log(error);
        } else {
          res.redirect("/");
        }
      }
    );
  } else {
    next();
  }
};

router.get("/", loginCheck, (req, res) => {
  adminHelpers.getDoctors().then((response) => {
    res.render("user/index", {
      user: req.user,
      title: "Galaxieon Care",
      header: true,
      doctor: response,
    });
  });
});

router.get("/signup", tokenCheck, (req, res) => {
  res.render("user/signup", {
    title: "Create An Account",
    error: req.session.signuperr,
  });
  req.session.signuperr = null;
});

router.post("/signup", (req, res) => {
  userHelpers
    .doSignup(req.body)
    .then((response) => {
      delete response.password;
      var token = jwt.sign(response, process.env.JWT_SECERT, {
        expiresIn: "60d",
      });
      res.cookie("userToken", token);
      res.redirect("/");
    })
    .catch((error) => {
      req.session.signuperr = error.msg;
      res.redirect("/signup");
    });
});

router.get("/logout", (req, res) => {
  res.clearCookie("userToken");
  res.redirect("/");
});

module.exports = router;
