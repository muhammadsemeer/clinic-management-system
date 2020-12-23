var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();
const jwt = require("jsonwebtoken");
const { verify } = require("../helpers/google-oauth");
const { sendOTP, verfiyOTP } = require("../helpers/send-otp");
const { createSlots } = require("../helpers/create-time-slot");
const Fuse = require("fuse.js");
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

const verifyToken = (req, res, next) => {
  const rawCookies = req.headers.cookie.split("; ");

  const parsedCookies = {};
  rawCookies.forEach((rawCookie) => {
    const parsedCookie = rawCookie.split("=");
    parsedCookies[parsedCookie[0]] = parsedCookie[1];
  });
  if (parsedCookies.userToken) {
    jwt.verify(
      parsedCookies.userToken,
      process.env.JWT_SECERT,
      (error, decoded) => {
        if (error) {
          res.json({ status: "No Auth" });
        } else {
          req.user = decoded;
          next();
        }
      }
    );
  } else {
    res.json({ status: "No Auth" });
  }
};

router.get("/", loginCheck, (req, res) => {
  if (req.cookies.redirect) {
    let path = req.cookies.redirect;
    res.clearCookie("redirect");
    res.redirect(path);
    return;
  }
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

router.post("/book-appoinment/:doctor", verifyToken, (req, res) => {
  userHelpers
    .checkBlocked(req.params.doctor, req.user._id)
    .then((result) => {
      userHelpers
        .bookApointment(req.params.doctor, req.user._id, req.body)
        .then((response) => {
          res.json({ status: true });
        })
        .catch((error) => {
          res.json({ status: false, error: error.msg });
        });
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
router.get("/profile/edit", verifyLogin, (req, res) => {
  userHelpers.getMyProfile(req.user._id).then((response) => {
    res.render("user/edit-profile", {
      title: "My Profile",
      user: req.user,
      userDetails: response,
      header: true,
      error: req.session.editErr,
    });
    req.session.editErr = null;
  });
});

router.post("/profile/edit", verifyLogin, (req, res) => {
  userHelpers
    .editPofrile(req.user._id, req.body)
    .then((response) => {
      if (req.body.email !== req.user.email) {
        res.clearCookie("userToken");
        res.render("user/message", {
          title: "Email Changed",
          message: "You have to relogin to complete the verification",
          redirect: "/login",
        });
      } else {
        res.redirect("/profile");
      }
    })
    .catch((error) => {
      req.session.editErr = error.msg;
      res.redirect("/profile/edit");
    });
});

router.get("/search", verifyLogin, async (req, res) => {
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
  const options = {
    includeScore: true,
    keys: ["date", "doctor.name", "doctor.field", "timeslot"],
  };
  const fuse1 = new Fuse(appointments, options);
  const fuse2 = new Fuse(requests, options);
  const fuse3 = new Fuse(cancelled, options);
  const fuse4 = new Fuse(consulted, options);
  const result1 = fuse1.search(req.query.q);
  const result2 = fuse2.search(req.query.q);
  const result3 = fuse3.search(req.query.q);
  const result4 = fuse4.search(req.query.q);
  res.render("user/search", {
    title: `${req.query.q} - Search`,
    user: req.user,
    header: true,
    query: req.query.q,
    result1,
    result2,
    result3,
    result4,
  });
});

module.exports = router;
