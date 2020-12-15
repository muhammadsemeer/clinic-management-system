var express = require("express");
const doctorHelpers = require("../helpers/doctor-helpers");
var router = express.Router();
var jwt = require("jsonwebtoken");
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
          next();
        }
      }
    );
  } else {
    res.json("login");
  }
};

router.get("/", verifyLogin, async (req, res) => {
  let todays = await doctorHelpers.getTodaysAppointment(req.doctor._id);
  let upcoming = await doctorHelpers.getUpcomingAppointments(req.doctor._id);
  let expired = await doctorHelpers.getExipredApointments(req.doctor._id);
  let cancelled = await doctorHelpers.getCancelledAppointment(req.doctor._id);
  res.render("doctor/index", {
    title: "Doctor Dashboard",
    doctorLogged: req.doctor,
    todays,
    upcoming,
    expired,
    cancelled,
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

router.get("/logout", (req, res) => {
  res.clearCookie("doctorToken");
  res.redirect("/login");
});

router.get("/bookings", verifyLogin, (req, res) => {
  doctorHelpers.getMybookings(req.doctor._id).then((response) => {
    res.render("doctor/bookings", {
      title: "My Booking",
      doctorLogged: req.doctor,
      bookings: response,
    });
  });
});

router.get("/bookings/approve/:id", verifyLogin, (req, res) => {
  doctorHelpers
    .changeBookingStatus(req.params.id, "Approved")
    .then((response) => {
      res.redirect("/bookings");
    });
});

router.delete("/bookings/cancel/:id", (req, res) => {
  doctorHelpers
    .changeBookingStatus(req.params.id, "Deleted")
    .then((response) => {
      res.json(true);
    });
});

router.get("/patients", verifyLogin, (req, res) => {
  doctorHelpers.getMyPatients(req.doctor._id).then((response) => {
    doctorHelpers.removeBlocked(req.doctor._id, response).then((result) => {
      res.render("doctor/patient", {
        title: "Patients",
        doctorLogged: req.doctor,
        patients: result,
      });
    });
  });
});

router.delete("/block-user/:id", verifyToken, (req, res) => {
  doctorHelpers.blockPatient(req.doctor._id, req.params.id).then((response) => {
    res.json(response);
  });
});

module.exports = router;
