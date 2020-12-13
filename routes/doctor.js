var express = require("express");
const doctorHelpers = require("../helpers/doctor-helpers");
var router = express.Router();
var jwt = require("jsonwebtoken")
require("dotenv").config()

const verifyLogin = (req, res, next) => {
  if (req.cookies.doctorToken) {
    jwt.verify(
      req.cookies.doctorToken,
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

const loginCheck = (req, res, next) => {
  if (req.cookies.doctorToken) {
    jwt.verify(
      req.cookies.doctorToken,
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

router.get("/", verifyLogin, async (req, res) => {
  let todaysAppoitnment = await doctorHelpers.getTodaysAppointemnts();
  let upcomingAppointments = await doctorHelpers.getUpcomingAppointemnts();
  res.render("doctor/index", {
    title: "Doctor Dashboard",
    todaysAppoitnment,
    upcomingAppointments,
  });
});

router.get("/login", loginCheck, (req, res) => {
  res.render("doctor/login", {
    title: "Doctor Login",
    error: req.session.loginErr,
    entered: req.session.loginUser,
  });
});

router.post("/login", (req, res) => {
  doctorHelpers
    .dologin(req.body)
    .then((data) => {
      delete data.password;
      var token = jwt.sign(data, process.env.JWT_SECERT, {
        expiresIn: "60d",
      });
      res.cookie("doctorToken", token, {
        httpOnly: true,
      });
      res.redirect("/");
    })
    .catch((error) => {
      req.session.loginErr = error.msg;
      req.session.loginUser = req.body;
      res.redirect("/login");
    });
});

module.exports = router;
