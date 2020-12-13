var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();
const jwt = require("jsonwebtoken");
const { verify } = require("../helpers/google-oauth");
const { sendOTP, verfiyOTP } = require("../helpers/send-otp");
const { createSlots } = require("../helpers/create-time-slot");
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

const verifyLogin = (req, res, next) => {
  if (req.cookies.userToken) {
    jwt.verify(
      req.cookies.userToken,
      process.env.JWT_SECERT,
      (error, decoded) => {
        if (error) {
          return res.redirect("/login");
        } else {
          req.user = decoded;
          next();
        }
      }
    );
  } else {
    res.redirect("/login");
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
  var format = /([0-9\+[1-9]{1}[0-9]{3,14})+$/;
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
  userHelpers.otpLogin(req.body.number).then((response) => {
    verfiyOTP(req.body.number, req.body.code)
      .then((data) => {
        delete data.password;
        var token = jwt.sign(response, process.env.JWT_SECERT, {
          expiresIn: "60d",
        });
        res.cookie("userToken", token, {
          httpOnly: true,
        });
        res.redirect("/");
      })
      .catch((error) => {
        req.session.loginErr = error.msg;
        req.session.loginUser = req.body.number;
        res.redirect("/login");
      });
  });
});

router.get("/book-appoinment/:id", loginCheck, (req, res) => {
  userHelpers.getBookingDoctor(req.params.id).then((response) => {
    res.render("user/book-appointment", {
      header: true,
      user: req.user,
      title: "Book Appointment",
      doctor: response,
    });
  });
});

router.get("/date", (req, res) => {
  let start = 0;
  let limit = 0;
  if (req.query.start !== "" && req.query.limit !== "") {
    start = req.query.start;
    limit = req.query.limit;
  }
  let date = Date.now();
  let startDate = new Date(
    new Date(date).setDate(new Date(date).getDate() + start * limit)
  ).toDateString();
  let middleDate = new Date(
    new Date(startDate).setDate(new Date(startDate).getDate() + 1)
  ).toDateString();
  let endDate = new Date(
    new Date(startDate).setDate(new Date(startDate).getDate() + 2)
  ).toDateString();
  res.json([startDate, middleDate, endDate]);
});

router.post("/book-appoinment/:doctor/:user", (req, res) => {
  userHelpers
    .bookApointment(req.params.doctor, req.params.user, req.body)
    .then((response) => {
      res.json({ status: true });
    })
    .catch((error) => {
      res.json({ status: false, error: error.msg });
    });
});

router.post("/get-timeslot/:id", (req, res) => {
  userHelpers.getBookingDoctor(req.params.id).then(async (response) => {
    var slotConfig = response.slotConfig;
    var timeslot = createSlots(slotConfig);
    var intermediateResult = [];
    let date = new Date(req.body.date);
    for (let i = 0; i < timeslot.length; i++) {
      var varDate;
      var check = timeslot[i].timeSlotStart.split(" ");
      var time = check[0].split(":");
      if (check[1] === "PM" && time[0] < 12) {
        time[0] = parseInt(time[0]) + 12;
        varDate = new Date(date).setHours(time[0], time[1]);
      } else {
        varDate = new Date(date).setHours(time[0], time[1]);
      }
      var today = Date.now();
      if (varDate >= today) {
        intermediateResult.push(timeslot[i]);
      }
    }
    var count = parseInt(req.body.start) * 3;
    var finalResult = [];
    let busySlots = await userHelpers.getBusySlots(date);
    for (let i = 0; i < intermediateResult.length; i++) {
      if (i < intermediateResult.length && busySlots.length !== 0) {
        for (let j = 0; j < busySlots.length; j++) {
          var busyCheck = busySlots[j].timeslot.split("-");
          if (
            busyCheck[0] === intermediateResult[i].timeSlotStart &&
            busyCheck[1] === intermediateResult[i].timeSlotEnd
          ) {
            intermediateResult.splice(i, 1);
          }
        }
      }
    }
    for (let i = count; i < intermediateResult.length; i++) {
      if (finalResult.length !== 3) {
        finalResult.push(intermediateResult[i]);
      }
    }
    res.json(finalResult);
  });
});

router.get("/appointments", verifyLogin, async (req, res) => {
  let appointments = await userHelpers.getMyAppointments(
    req.user._id,
    "Approved"
  );
  let requests = await userHelpers.getMyAppointments(req.user._id, "Pending");
  let cancelled = await userHelpers.getMyAppointments(req.user._id, "Deleted");
  let consulted = await userHelpers.getMyAppointments(
    req.user._id,
    "Consulted"
  );
  res.render("user/appointment", {
    user: req.user,
    header: true,
    title: "My Appoitments",
    appointments,
    requests,
    cancelled,
    consulted,
  });
});

router.delete("/cancel-appointment/:id", (req, res) => {
  userHelpers
    .cancelAppointment(req.params.id)
    .then((response) => {
      res.json(true);
    })
    .catch((error) => {
      res.json(false);
    });
});

router.get("/profile", verifyLogin, (req, res) => {
  userHelpers.getMyProfile(req.user._id).then((response) => {
    res.render("user/myprofile", {
      title: "My Profile",
      user: req.user,
      userDetails: response,
      header: true,
    });
  });
});

module.exports = router;
