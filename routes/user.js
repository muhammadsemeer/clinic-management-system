var express = require("express");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();
const jwt = require("jsonwebtoken");
const { verify } = require("../helpers/google-oauth");
const { sendOTP, verfiyOTP } = require("../helpers/send-otp");
const { createSlots } = require("../helpers/create-time-slot");
const Fuse = require("fuse.js");
const { exportExcel } = require("../helpers/export-xlsx");
const { sendMail } = require("../helpers/send-mail");
const myInsights = require("../helpers/user-insights");
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
          userHelpers
            .checkUserStatus(decoded._id)
            .then((response) => {
              next();
            })
            .catch((error) => {
              res.clearCookie("userToken");
              res.redirect("/");
            });
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
          userHelpers
            .checkUserStatus(decoded._id)
            .then((response) => {
              next();
            })
            .catch((error) => {
              res.clearCookie("userToken");
              res.redirect("/");
            });
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
          userHelpers
            .checkUserStatus(decoded._id)
            .then((response) => {
              next();
            })
            .catch((error) => {
              res.clearCookie("userToken");
              res.json({ status: "No Auth" });
            });
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
        expires: new Date(Date.now() + 5184000000),
        secure: process.env.NODE_ENV === "production" ? true : false,
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
            expires: new Date(Date.now() + 5184000000),
            secure: process.env.NODE_ENV === "production" ? true : false,
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
        expires: new Date(Date.now() + 5184000000),
        secure: process.env.NODE_ENV === "production" ? true : false,
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

router.get("/resent/otp/:no", (req, res) => {
  userHelpers
    .checkMobile(req.params.no)
    .then((response) => {
      sendOTP(response)
        .then((data) => {
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
        expires: new Date(Date.now() + 5184000000),
        secure: process.env.NODE_ENV === "production" ? true : false,
      });
      res.redirect("/");
    })
    .catch((error) => {
      res.render("user/password", {
        title: "Login",
        email: req.body.email,
        error: error.msg,
      });
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
          expires: new Date(Date.now() + 5184000000),
          secure: process.env.NODE_ENV === "production" ? true : false,
        });
        res.redirect("/");
      })
      .catch((error) => {
        res.render("user/otp", {
          title: "Verify OTP",
          mobileno: req.body.number,
          error: error.msg,
        });
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
          res.json({ status: true, response });
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
  let appointments, requests, cancelled, consulted, date;
  if (req.query.date) {
    date = new Date(req.query.date);
    date = new Date(new Date(date).setHours(24, 0, 0, 0))
      .toISOString()
      .slice(0, 10);
    appointments = await userHelpers.getMyAppointmentsByDate(
      req.user._id,
      "Approved",
      req.query.date
    );
    requests = await userHelpers.getMyAppointmentsByDate(
      req.user._id,
      "Pending",
      req.query.date
    );
    cancelled = await userHelpers.getMyAppointmentsByDate(
      req.user._id,
      "Deleted",
      req.query.date
    );
    consulted = await userHelpers.getMyAppointmentsByDate(
      req.user._id,
      "Consulted",
      req.query.date
    );
  } else {
    appointments = await userHelpers.getMyAppointments(
      req.user._id,
      "Approved"
    );
    requests = await userHelpers.getMyAppointments(req.user._id, "Pending");
    cancelled = await userHelpers.getMyAppointments(req.user._id, "Deleted");
    consulted = await userHelpers.getMyAppointments(req.user._id, "Consulted");
  }
  res.render("user/appointment", {
    user: req.user,
    header: true,
    title: "My Appoitments",
    appointments,
    requests,
    cancelled,
    consulted,
    date: date,
  });
});

router.delete("/cancel-appointment/:id", (req, res) => {
  userHelpers
    .cancelAppointment(req.params.id)
    .then((response) => {
      res.json({ status: true, appId: req.params.id });
    })
    .catch((error) => {
      res.json({ status: false });
    });
});

router.get("/profile", verifyLogin, async (req, res) => {
  let userDetails = await userHelpers.getMyProfile(req.user._id);
  let insights = await myInsights(req.user._id);
  res.render("user/myprofile", {
    title: "My Profile",
    user: req.user,
    userDetails,
    insights,
    header: true,
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
    .editPofrile(req.user, req.body)
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

router.get("/history/download", verifyLogin, async (req, res) => {
  let columnNames = [
    "ID",
    "Doctor Name",
    "Consulted Date",
    "Consulted Time",
    "Medicines",
    "Notes",
  ];
  let dataDB = await userHelpers.getMyAppointments(req.user._id, "Consulted");
  let datas = dataDB.map((element) => {
    if (!element.medicines || !element.notes) {
      element.medicines = "";
      element.notes = "";
    }
    return [
      element._id.toString(),
      element.doctor.name,
      element.date,
      element.timeslot,
      element.medicines.toString(),
      element.notes,
    ];
  });
  exportExcel(datas, columnNames, "History", `/xlsx/user/${req.user._id}.xlsx`);
  res.render("user/download", {
    title: "Download History",
    header: true,
    user: req.user,
    path: `/xlsx/user/${req.user._id}.xlsx`,
  });
});

router.get("/search/doctors", async (req, res) => {
  let doctors = await adminHelpers.getDoctors();
  const options = {
    includeScore: true,
    keys: ["name", "field", "specialised"],
  };
  const fuse = new Fuse(doctors, options);
  const result = fuse.search(req.query.q);
  res.json(result);
});

router.get("/profile/change-password", verifyLogin, async (req, res) => {
  let profileDetails = await userHelpers.getMyProfile(req.user._id);
  var payload = {
    id: req.user._id,
  };
  var token = jwt.sign(payload, process.env.JWT_RESET_PASSWORD, {
    expiresIn: "5m",
  });
  var template = `
  <h2>Change Password</h2>
  <a href="${process.env.USER_HOSTNAME}/profile/change-password/${token}">${process.env.USER_HOSTNAME}/profile/change-password/${token}</a>
  `;
  sendMail(profileDetails.email, "Change Password", template);
  res.render("user/password-meassage", {
    title: "Change Password",
    message: `Change password link sent to your mail ${profileDetails.email}`,
  });
});

router.get("/profile/change-password/:token", (req, res) => {
  jwt.verify(
    req.params.token,
    process.env.JWT_RESET_PASSWORD,
    (err, decoded) => {
      if (err) {
        res.render("user/password-meassage", {
          title: "Link Exipred",
          message: `The link was exipred the link is only valid for 5 Minutes`,
        });
      } else {
        res.render("user/change-password", {
          title: "New Password",
          id: decoded.id,
        });
      }
    }
  );
});

router.post("/profile/change-password", (req, res) => {
  userHelpers.changePassword(req.body).then((response) => {
    res.clearCookie("userToken");
    res.redirect("/login");
  });
});

router.get("/forget/password", (req, res) => {
  res.render("user/forget-password", {
    title: "Forget Password",
    error: req.session.resetErr,
  });
  req.session.resetErr = null;
});

router.post("/reset/password/send", (req, res) => {
  userHelpers
    .getMyProfileEmail(req.body.email)
    .then((response) => {
      var payload = {
        id: response._id,
      };
      var token = jwt.sign(payload, process.env.JWT_RESET_PASSWORD, {
        expiresIn: "5m",
      });
      var template = `
  <h2>Reset Password</h2>
  <a href="${process.env.USER_HOSTNAME}/reset/password/${token}">${process.env.USER_HOSTNAME}/reset/password/${token}</a>
  `;
      sendMail(response.email, "Reset Password", template);
      res.render("user/password-meassage", {
        title: "Reset Password",
        message: `Reset password link sent to your mail ${response.email}`,
      });
    })
    .catch((error) => {
      req.session.resetErr = error.msg;
      res.redirect("/forget/password");
    });
});

router.get("/reset/password/:token", (req, res) => {
  jwt.verify(
    req.params.token,
    process.env.JWT_RESET_PASSWORD,
    (err, decoded) => {
      if (err) {
        res.render("user/password-meassage", {
          title: "Link Exipred",
          message: `The link was exipred the link is only valid for 5 Minutes`,
        });
      } else {
        res.render("user/change-password", {
          title: "New Password",
          id: decoded.id,
        });
      }
    }
  );
});

router.post("/reset/password", (req, res) => {
  userHelpers.changePassword(req.body).then((response) => {
    res.redirect("/login");
  });
});

router.get("/mydoctors", verifyLogin, async (req, res) => {
  let doctors = await userHelpers.getMyDoctors(req.user._id);
  res.render("user/my-doctors", {
    user: req.user,
    header: true,
    title: "My Doctors",
    doctors,
  });
});

router.get("/history/:id", verifyLogin, async (req, res) => {
  let reqDoctor = await userHelpers.getBookingDoctor(req.params.id);
  let history = await userHelpers.getConsultedHistory(
    req.user._id,
    req.params.id
  );
  res.render("user/history", {
    user: req.user,
    header: true,
    title: `Cosnulted History - ${reqDoctor.name}`,
    reqDoctor,
    history,
  });
});

router.get("/history/download/:id", verifyLogin, async (req, res) => {
  let columnNames = [
    "ID",
    "Doctor Name",
    "Consulted Date",
    "Consulted Time",
    "Medicines",
    "Notes",
  ];
  let dataDB = await userHelpers.getConsultedHistory(
    req.user._id,
    req.params.id
  );
  let datas = dataDB.map((element) => {
    if (!element.medicines || !element.notes) {
      element.medicines = "";
      element.notes = "";
    }
    return [
      element._id.toString(),
      element.doctor.name,
      element.date,
      element.timeslot,
      element.medicines.toString(),
      element.notes,
    ];
  });
  exportExcel(
    datas,
    columnNames,
    "History",
    `/xlsx/user/${req.user._id}_${req.params.id}.xlsx`
  );
  res.render("user/download", {
    title: "Download History",
    header: true,
    user: req.user,
    path: `/xlsx/user/${req.user._id}_${req.params.id}.xlsx`,
  });
});

router.get("/image-upload/:id", verifyLogin, (req, res) => {
  res.render("user/image-crop", {
    doctorLogged: req.doctor,
    id: req.params.id,
    title: "Edit Image",
    header: true,
  });
});

router.post("/image/upload/:id", verifyToken, (req, res) => {
  let image = req.files.image;
  image.mv("./public/images/users/" + req.params.id + ".jpg", (err) => {
    if (err) {
      res.json({ status: false });
    } else {
      res.json({ status: true });
    }
  });
});

router.get("/myprofile", (req, res) => {
  res.redirect("/profile");
});

module.exports = router;
