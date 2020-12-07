var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();
const jwt = require("jsonwebtoken");
const { verify } = require("../helpers/google-oauth");
const { sendOTP, verfiyOTP } = require("../helpers/send-otp");
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
    userDetails: req.session.signupUser,
  });
  req.session.signuperr = null;
  req.session.signupUser = null;
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
      req.session.signupUser = req.body;
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
  res.render("user/login", {
    title: "Login",
    error: req.session.loginErr,
    input: req.session.loginUser,
  });
  req.session.loginErr = null;
  req.session.loginUser = null;
});

router.post("/login", tokenCheck, (req, res) => {
  var format = /([0-9])\w+/g;
  var input = req.body.email;
  if (format.test(input)) {
    userHelpers
      .checkMobile(input)
      .then((response) => {
        sendOTP(response)
          .then((data) => {
            res.render("user/otp", { title: "Verify OTP", mobileno: response });
          })
          .catch((error) => {
            req.session.loginErr = error.msg;
            req.session.loginUser = input;
            res.redirect("/login");
          });
      })
      .catch((error) => {
        req.session.loginErr = error.msg;
        req.session.loginUser = input;
        res.redirect("/login");
      });
  } else {
    userHelpers
      .checkEmail(input)
      .then((response) => {
        res.render("user/password", { title: "Login", email: response });
      })
      .catch((error) => {
        req.session.loginErr = error.msg;
        req.session.loginUser = input;
        res.redirect("/login");
      });
  }
});

router.post("/login/password", tokenCheck, (req, res) => {
  userHelpers
    .passwordLogin(req.body)
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
      res.render("user/password", { email: req.body.email, error: error.msg });
    });
});

router.post("/login/otp-verify", (req, res) => {
  console.log(req.body);
  userHelpers.otpLogin(req.body.number).then((response) => {
    console.log(response);
    verfiyOTP(req.body.number, req.body.code)
      .then((data) => {
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
        res.render("user/otp", { mobileno: req.body.number, error: error });
      });
  });
});

module.exports = router;
