var express = require("express");
const doctorHelpers = require("../helpers/doctor-helpers");
var router = express.Router();
var jwt = require("jsonwebtoken");
const Fuse = require("fuse.js");
const { exportExcel } = require("../helpers/export-xlsx");
const { sendMail } = require("../helpers/send-mail");
require("dotenv").config();

const verifyLogin = (req, res, next) => {
  if (req.cookies.doctorToken) {
    jwt.verify(
      req.cookies.doctorToken,
      process.env.JWT_SECERT,
      (error, decoded) => {
        if (error) {
          return res.redirect("/login");
        } else {
          req.doctor = decoded;
          doctorHelpers
            .checkUserStatus(decoded._id)
            .then((resposne) => {
              if (decoded.slotConfig) {
                next();
              } else if (req.url === "/config/slot") {
                next();
              } else {
                res.redirect("/config/slot");
              }
            })
            .catch((error) => {
              res.clearCookie("doctorToken");
              res.redirect("/login");
            });
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
          req.doctor = decoded;
          res.redirect("/");
        }
      }
    );
  } else {
    next();
  }
};

const verifyToken = (req, res, next) => {
  const rawCookies = req.headers.cookie.split("; ");

  const parsedCookies = {};
  rawCookies.forEach((rawCookie) => {
    const parsedCookie = rawCookie.split("=");
    parsedCookies[parsedCookie[0]] = parsedCookie[1];
  });
  if (parsedCookies.doctorToken) {
    jwt.verify(
      parsedCookies.doctorToken,
      process.env.JWT_SECERT,
      (error, decoded) => {
        if (error) {
          res.json("login");
        } else {
          req.doctor = decoded;
          doctorHelpers
            .checkUserStatus(decoded._id)
            .then((resposne) => {
              next();
            })
            .catch((error) => {
              res.clearCookie("doctorToken");
              res.redirect("/login");
            });
        }
      }
    );
  } else {
    res.json("login");
  }
};

router.get("/", verifyLogin, (req, res) => {
  doctorHelpers.getMybookings(req.doctor._id).then((response) => {
    res.render("doctor/index", {
      title: "My Booking",
      doctorLogged: req.doctor,
      bookings: response,
    });
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
        expires: new Date(Date.now() + 5184000000),
        secure: process.env.NODE_ENV === "production" ? true : false,
      });
      res.redirect("/");
    })
    .catch((error) => {
      req.session.loginErr = error.msg;
      req.session.loginUser = req.body;
      res.redirect("/login");
    });
});

router.get("/logout", (req, res) => {
  res.clearCookie("doctorToken");
  res.redirect("/login");
});

router.get("/bookings", (req, res) => {
  res.redirect("/");
});

router.get("/appointments", verifyLogin, async (req, res) => {
  let todays = await doctorHelpers.getTodaysAppointment(req.doctor._id);
  let upcoming, expired, cancelled, consulted, date;
  if (req.query.date) {
    date = new Date(req.query.date);
    date = new Date(new Date(date).setHours(24, 0, 0, 0))
      .toISOString()
      .slice(0, 10);
    upcoming = await doctorHelpers.getUpcomingAppointmentsByDate(
      req.doctor._id,
      req.query.date
    );
    expired = await doctorHelpers.getExipredApointmentsByDate(
      req.doctor._id,
      req.query.date
    );
    cancelled = await doctorHelpers.getCancelledAppointmentByDate(
      req.doctor._id,
      req.query.date
    );
    consulted = await doctorHelpers.getConsultedAppointmentsByDate(
      req.doctor._id,
      req.query.date
    );
  } else {
    upcoming = await doctorHelpers.getUpcomingAppointments(req.doctor._id);
    expired = await doctorHelpers.getExipredApointments(req.doctor._id);
    cancelled = await doctorHelpers.getCancelledAppointment(req.doctor._id);
    consulted = await doctorHelpers.getConsultedAppointments(req.doctor._id);
  }
  res.render("doctor/appointments", {
    title: "Doctor Dashboard",
    doctorLogged: req.doctor,
    search: true,
    date: date,
    todays,
    upcoming,
    expired,
    cancelled,
    consulted,
  });
});

router.get("/bookings/approve/:id", verifyLogin, (req, res) => {
  doctorHelpers
    .changeBookingStatus(req.params.id, "Approved")
    .then((response) => {
      doctorHelpers.sendInfo(req.params.id, "Approved").then((response) => {
        res.redirect("/");
      });
    });
});

router.delete("/bookings/cancel/:id", (req, res) => {
  doctorHelpers
    .changeBookingStatus(req.params.id, "Deleted")
    .then((response) => {
      doctorHelpers.sendInfo(req.params.id, "Rejected").then((response) => {
        res.json(true);
      });
    });
});

router.get("/patients", verifyLogin, async (req, res) => {
  let allPateints = await doctorHelpers.getMyPatients(req.doctor._id);
  let blocked = await doctorHelpers.getBlocked(req.doctor._id, allPateints);
  let notBlocked = await doctorHelpers.removeBlocked(
    req.doctor._id,
    allPateints
  );
  res.render("doctor/patient", {
    title: "Patients",
    doctorLogged: req.doctor,
    notBlocked,
    blocked,
  });
});

router.delete("/block-user/:id", verifyToken, (req, res) => {
  doctorHelpers.blockPatient(req.doctor._id, req.params.id).then((response) => {
    res.json(response);
  });
});
router.put("/block-user/:id", verifyToken, (req, res) => {
  doctorHelpers.unBlock(req.doctor._id, req.params.id).then((response) => {
    res.json(response);
  });
});

router.get("/myprofile", verifyLogin, (req, res) => {
  doctorHelpers.getMyProfile(req.doctor._id).then((response) => {
    res.render("doctor/profile", {
      title: "My Profile",
      doctorLogged: req.doctor,
      doctorDetails: response,
    });
  });
});

router.get("/image-upload/:id", verifyLogin, (req, res) => {
  res.render("doctor/image-crop", {
    doctorLogged: req.doctor,
    id: req.params.id,
    title: "Edit Image",
  });
});

router.post("/image/upload/:id", verifyToken, (req, res) => {
  let image = req.files.image;
  image.mv("./public/images/doctor/" + req.params.id + ".jpg", (err) => {
    if (err) {
      res.json({ status: false });
    } else {
      res.json({ status: true });
    }
  });
});

router.get("/profile/edit", verifyLogin, (req, res) => {
  doctorHelpers.getMyProfile(req.doctor._id).then((response) => {
    res.render("doctor/edit-profile", {
      title: "Edit Profile",
      doctorLogged: req.doctor,
      doctor: response,
    });
  });
});

router.get("/username/:name", verifyToken, (req, res) => {
  doctorHelpers
    .checkUsername(req.params.name, req.doctor.username)
    .then((response) => {
      res.json(response);
    });
});

router.post("/profile/details/:id", verifyLogin, (req, res) => {
  doctorHelpers
    .editProfileDeatils(req.doctor._id, req.body)
    .then((response) => {
      res.redirect("/myprofile");
    });
});

router.get("/profile/username", verifyLogin, (req, res) => {
  doctorHelpers.getMyProfile(req.doctor._id).then((response) => {
    res.render("doctor/edit-username", {
      title: "Edit Username",
      doctorLogged: req.doctor,
      doctor: response,
    });
  });
});

router.post("/profile/username/:id", verifyLogin, (req, res) => {
  doctorHelpers.editUsername(req.doctor._id, req.body.name).then((response) => {
    res.clearCookie("doctorToken");
    res.render("doctor/message", {
      title: "Username Changed",
      message: "You have to relogin to complete the verification",
      redirect: "/login",
    });
  });
});

router.get("/profile/slot-config", verifyLogin, (req, res) => {
  doctorHelpers.getMySlotConfig(req.doctor._id).then((response) => {
    console.log(response);
    res.render("doctor/slot-config", {
      title: "Edit Slot Config",
      doctorLogged: req.doctor,
      slotConfig: response.slotConfig,
    });
  });
});

router.post("/profile/slot-config/", verifyLogin, (req, res) => {
  var slotConfig = {
    configSlotHours: req.body.slotHours,
    configSlotMinutes: req.body.slotMinutes,
    configSlotPreparation: req.body.slotPreparation,
    timeArr: [{ startTime: req.body.startTime, endTime: req.body.endTime }],
  };
  doctorHelpers
    .upadateSlotConfig(req.doctor._id, slotConfig)
    .then((response) => {
      res.redirect("/myprofile");
    });
});

router.get("/consult/:id", verifyLogin, (req, res) => {
  doctorHelpers.getAppointmentDetails(req.params.id).then((response) => {
    res.render("doctor/consult", {
      title: "Consult Patient",
      doctorLogged: req.doctor,
      appointment: response,
    });
  });
});

router.post("/consult/:id", verifyToken, (req, res) => {
  let medicines = req.body.medicines.split(",");
  let notes = req.body.notes;
  doctorHelpers
    .addPrescription(req.params.id, medicines, notes)
    .then((response) => {
      res.json(true);
    });
});

router.get("/search", verifyLogin, async (req, res) => {
  let todaysAppointments = await doctorHelpers.getTodaysAppointment(
    req.doctor._id
  );
  let upcomingAppointments = await doctorHelpers.getUpcomingAppointments(
    req.doctor._id
  );
  let expiredAppointments = await doctorHelpers.getExipredApointments(
    req.doctor._id
  );
  let cancelledAppointments = await doctorHelpers.getCancelledAppointment(
    req.doctor._id
  );
  let consultedAppointments = await doctorHelpers.getConsultedAppointments(
    req.doctor._id
  );
  const options = {
    includeScore: true,
    keys: ["date", "user.name", "user.email", "timeslot"],
  };
  const fuse1 = new Fuse(todaysAppointments, options);
  const fuse2 = new Fuse(upcomingAppointments, options);
  const fuse3 = new Fuse(consultedAppointments, options);
  const fuse4 = new Fuse(cancelledAppointments, options);
  const fuse5 = new Fuse(expiredAppointments, options);
  const result1 = fuse1.search(req.query.q);
  const result2 = fuse2.search(req.query.q);
  const result3 = fuse3.search(req.query.q);
  const result4 = fuse4.search(req.query.q);
  const result5 = fuse5.search(req.query.q);
  res.render("doctor/search", {
    title: `${req.query.q} - Search`,
    doctorLogged: req.doctor,
    search: true,
    query: req.query.q,
    result1,
    result2,
    result3,
    result4,
    result5,
  });
});

router.get("/history/:id", verifyLogin, (req, res) => {
  doctorHelpers
    .getPatientHistory(req.doctor._id, req.params.id)
    .then((response) => {
      res.render("doctor/history", {
        title: "Consulted History",
        doctorLogged: req.doctor,
        userId: req.params.id,
        history: response,
      });
    });
});

router.get("/history/download/:id", verifyLogin, async (req, res) => {
  let columnNames = [
    "ID",
    "Pateint Name",
    "Consulted Date",
    "Consulted Time",
    "Medicines",
    "Notes",
  ];
  let dataDB = await doctorHelpers.getPatientHistory(
    req.doctor._id,
    req.params.id
  );
  let datas = dataDB.map((element) => {
    if (!element.medicines || !element.notes) {
      element.medicines = "";
      element.notes = "";
    }
    return [
      element._id.toString(),
      element.user.name,
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
    `/xlsx/doctor/${req.params.id}.xlsx`
  );
  res.render("doctor/download", {
    title: "Download History",
    doctorLogged: req.doctor,
    userId: req.params.id,
  });
});

router.get("/search/patient", verifyToken, async (req, res) => {
  let allPateints = await doctorHelpers.getMyPatients(req.doctor._id);
  let blocked = await doctorHelpers.getBlocked(req.doctor._id, allPateints);
  let notBlocked = await doctorHelpers.removeBlocked(
    req.doctor._id,
    allPateints
  );
  const options = {
    includeScore: true,
    keys: ["name", "email", "contactno"],
  };
  const fuse1 = new Fuse(notBlocked, options);
  const fuse2 = new Fuse(blocked, options);
  const result1 = fuse1.search(req.query.q);
  const result2 = fuse2.search(req.query.q);
  res.json({ result1, result2 });
});

router.get("/profile/change-password", verifyLogin, async (req, res) => {
  let profileDetails = await doctorHelpers.getMyProfile(req.doctor._id);
  var payload = {
    id: req.doctor._id,
  };
  var token = jwt.sign(payload, process.env.JWT_RESET_PASSWORD, {
    expiresIn: "5m",
  });
  var template = `
  <h2>Change Password</h2>
  <a href="${process.env.DOCTOR_HOSTNAME}/profile/change-password/${token}">${process.env.DOCTOR_HOSTNAME}/profile/change-password/${token}</a>
  `;
  sendMail(profileDetails.email, "Change Password", template);
  res.render("doctor/password-meassage", {
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
        res.render("doctor/password-meassage", {
          title: "Link Exipred",
          message: `The link was exipred the link is only valid for 5 Minutes`,
        });
      } else {
        res.render("doctor/change-password", {
          title: "New Password",
          id: decoded.id,
        });
      }
    }
  );
});

router.post("/profile/change-password", (req, res) => {
  doctorHelpers.changePassword(req.body).then((response) => {
    res.clearCookie("doctorToken");
    res.redirect("/");
  });
});

router.get("/forget/password", (req, res) => {
  res.render("doctor/forget-password", {
    title: "Forget Password",
    error: req.session.resetErr,
  });
  req.session.resetErr = null;
});

router.post("/reset/password/send", (req, res) => {
  doctorHelpers
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
  <a href="${process.env.DOCTOR_HOSTNAME}/reset/password/${token}">${process.env.DOCTOR_HOSTNAME}/reset/password/${token}</a>
  `;
      sendMail(response.email, "Reset Password", template);
      res.render("doctor/password-meassage", {
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
        res.render("doctor/password-meassage", {
          title: "Link Exipred",
          message: `The link was exipred the link is only valid for 5 Minutes`,
        });
      } else {
        res.render("doctor/change-password", {
          title: "New Password",
          id: decoded.id,
        });
      }
    }
  );
});

router.post("/reset/password", (req, res) => {
  doctorHelpers.changePassword(req.body).then((response) => {
    res.redirect("/login");
  });
});

router.get("/config/slot", verifyLogin, (req, res) => {
  res.render("doctor/create-slot-config", {
    title: "Create Slot Config",
    doctorLogged: req.doctor,
  });
});

router.post("/config/slot", verifyLogin, (req, res) => {
  var slotConfig = {
    configSlotHours: req.body.slotHours,
    configSlotMinutes: req.body.slotMinutes,
    configSlotPreparation: req.body.slotPreparation,
    timeArr: [{ startTime: req.body.startTime, endTime: req.body.endTime }],
  };
  doctorHelpers
    .upadateSlotConfig(req.doctor._id, slotConfig)
    .then((response) => {
      doctorHelpers
        .getMyProfile(req.doctor._id)
        .then((data) => {
          delete data.password;
          var token = jwt.sign(data, process.env.JWT_SECERT, {
            expiresIn: "60d",
          });
          res.cookie("doctorToken", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 5184000000),
            secure: process.env.NODE_ENV === "production" ? true : false,
          });
          res.redirect("/");
        })
        .catch((error) => {
          req.session.loginErr = error.msg;
          req.session.loginUser = req.body;
          res.redirect("/login");
        });
    });
});

module.exports = router;
