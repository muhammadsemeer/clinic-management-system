var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();
const jwt = require("jsonwebtoken");
const { verify } = require("../helpers/google-oauth");
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
      res.cookie("userToken", token, {
        httpOnly: true,
      });
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

router.post("/signup/oauth/google", (req, res) => {
  verify(req.body.authtoken)
    .then((data) => {
      userHelpers
        .OAuth(req.body, "Google")
        .then((response) => {
          var token = jwt.sign(response, process.env.JWT_SECERT, {
            expiresIn: "60d",
          });
          res.cookie("userToken", token, {
            httpOnly: true,
          });
          res.json({ status: true });
        })
        .catch((error) => {
          res.json({ status: false, error: error });
        });
    })
    .catch((error) => {
      console.log(error);
    });
});

router.post("/signup/oauth/facebook", (req, res) => {
  userHelpers
    .OAuth(req.body, "Facebook")
    .then((response) => {
      var token = jwt.sign(response, process.env.JWT_SECERT, {
        expiresIn: "60d",
      });
      res.cookie("userToken", token, {
        httpOnly: true,
      });
      res.json({ status: true });
    })
    .catch((error) => {
      res.json({ status: false, error: error });
    });
});

router.get("/login", tokenCheck, (req, res) => {
  res.render("user/login", { title: "Login" });
});

module.exports = router;
