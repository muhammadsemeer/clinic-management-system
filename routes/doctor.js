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
  let consulted = await doctorHelpers.getConsultedAppointments(req.doctor._id);
  res.render("doctor/index", {
    title: "Doctor Dashboard",
    doctorLogged: req.doctor,
    todays,
    upcoming,
    expired,
    cancelled,
    consulted,
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

router.get("/patients", verifyLogin, async (req, res) => {
  let allPateints = await doctorHelpers.getMyPatients(req.doctor._id);
  let notBlocked = await doctorHelpers.removeBlocked(
    req.doctor._id,
    allPateints
  );
  let blocked = await doctorHelpers.getBlocked(req.doctor._id, allPateints);
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

router.post("/doctor/upload/:id", verifyToken, (req, res) => {
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

module.exports = router;
