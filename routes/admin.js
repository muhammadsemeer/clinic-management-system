var express = require("express");
var router = express.Router();
const adminHelpers = require("../helpers/admin-helpers");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../helpers/send-mail");
const { sendMessage } = require("../helpers/sms-send");
const fs = require("fs");
const Fuse = require("fuse.js");
const { generatePassword } = require("../helpers/generate-password");
const verifyLogin = (req, res, next) => {
  if (req.cookies.adminToken) {
    jwt.verify(
      req.cookies.adminToken,
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
  if (req.cookies.adminToken) {
    jwt.verify(
      req.cookies.adminToken,
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

/* GET home page. */
router.get("/", verifyLogin, async (req, res) => {
  let counts = await adminHelpers.getCounts();
  res.render("admin/index", { title: "Dashboard", admin: req.admin, counts });
});

router.get("/login", loginCheck, async (req, res) => {
  res.render("admin/login", {
    title: "Admin Login",
    error: req.session.loginErr,
    email: req.session.errMail,
    password: req.session.errPass,
  });
  req.session.loginErr = null;
  req.session.errMail = null;
  req.session.errPass = null;
});

router.post("/login", async (req, res) => {
  adminHelpers
    .doLogin(req.body)
    .then((response) => {
      delete response.password;
      var token = jwt.sign(response, process.env.JWT_SECERT, {
        expiresIn: "10d",
      });
      res.cookie("adminToken", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 864000000),
        secure: process.env.NODE_ENV === "production" ? true : false,
      });
      res.redirect("/");
    })
    .catch((error) => {
      req.session.loginErr = error.msg;
      req.session.errMail = req.body.email;
      req.session.errPass = req.body.password;
      res.redirect("/login");
    });
});

router.get("/logout", (req, res) => {
  res.clearCookie("adminToken");
  res.redirect("/login");
});

router.get("/users", verifyLogin, async (req, res) => {
  let doctor = await adminHelpers.getDoctors();
  let patient = await adminHelpers.getPatients();
  res.render("admin/users", {
    title: "Users",
    admin: req.admin,
    search2: true,
    doctor,
    patient,
  });
});

router.get("/appointment", verifyLogin, async (req, res) => {
  let doctor = await adminHelpers.getDoctors();
  res.render("admin/appointment", {
    title: "Users",
    admin: req.admin,
    search2: true,
    doctor,
  });
});

router.get("/appointment/:id", verifyLogin, async (req, res) => {
  let todays = await adminHelpers.getTodaysAppointment(req.params.id);
  let upcoming, expired, cancelled, consulted, pending, date;
  if (req.query.date) {
    date = new Date(req.query.date);
    date = new Date(new Date(date).setHours(24, 0, 0, 0))
      .toISOString()
      .slice(0, 10);
    upcoming = await adminHelpers.getUpcomingAppointmentsByDate(
      req.params.id,
      req.query.date
    );
    expired = await adminHelpers.getExipredApointmentsByDate(
      req.params.id,
      req.query.date
    );
    cancelled = await adminHelpers.getCancelledAppointmentByDate(
      req.params.id,
      req.query.date
    );
    consulted = await adminHelpers.getConsultedAppointmentsByDate(
      req.params.id,
      req.query.date
    );
    pending = await adminHelpers.getPendingAppointmentsByDate(
      req.params.id,
      req.query.date
    );
  } else {
    upcoming = await adminHelpers.getUpcomingAppointments(req.params.id);
    expired = await adminHelpers.getExipredApointments(req.params.id);
    cancelled = await adminHelpers.getCancelledAppointment(req.params.id);
    consulted = await adminHelpers.getConsultedAppointments(req.params.id);
    pending = await adminHelpers.getPendingAppointments(req.params.id);
  }
  res.render("admin/appointment-id", {
    title: "Appointment",
    admin: req.admin,
    searchId: req.params.id,
    search: true,
    todays,
    upcoming,
    expired,
    cancelled,
    consulted,
    pending,
    date,
  });
});

router.get("/myprofile", verifyLogin, (req, res) => {
  adminHelpers.getMyProfile(req.admin.email).then((response) => {
    res.render("admin/profile", {
      title: "My Profile",
      admin: req.admin,
      adminDetails: response,
    });
  });
});

router.get("/add-doctor", verifyLogin, (req, res) => {
  res.render("admin/add-doctor", {
    title: "Add Doctor",
    admin: req.admin,
    error: req.session.adderror,
    doctor: req.session.doctor,
  });
  req.session.adderror = null;
  req.session.doctor = null;
});

router.get("/add-patient", verifyLogin, (req, res) => {
  res.render("admin/add-patient", {
    title: "Add Patient",
    admin: req.admin,
    error: req.session.adderror,
    patient: req.session.pateint,
  });
  req.session.adderror = null;
  req.session.pateint = null;
});

router.post("/add-doctor", verifyLogin, (req, res) => {
  req.body.password = generatePassword();
  var to = req.body.email;
  var sub = "Added to Doctor's List on Galaxieon Care";
  var output = `
  <h3>Hi, ${req.body.name}</h3>
  <h3>Greetings from Galaxieon Care</h3>

  <p>Admin Of Galaxieon Care added you to our doctor's list.
  You can login to your doctor accout with your username and password that created by Admin</p>

  <p>Username: ${req.body.username}
  Password: ${req.body.password}</p>
  <a href="${process.env.DOCTOR_HOSTNAME}">Click To Login<a>
`;
  adminHelpers
    .addDoctor(req.body)
    .then((response) => {
      sendMail(to, sub, output)
        .then((data) => {
          res.render("admin/image-crop", {
            admin: req.admin,
            id: response._id,
            title: "Image Upload",
          });
        })
        .catch((error) => {
          res.render("admin/image-crop", {
            admin: req.admin,
            id: response._id,
          });
        });
    })
    .catch((error) => {
      req.session.adderror = error.msg;
      req.session.doctor = req.body;
      res.redirect("/add-doctor");
    });
});

router.get("/username/:name", verifyLogin, (req, res) => {
  adminHelpers.checkUsername(req.params.name).then((response) => {
    res.json(response);
  });
});

router.delete("/doctors/:id", verifyLogin, (req, res) => {
  adminHelpers
    .deleteDoctor(req.params.id)
    .then((response) => {
      fs.unlink(
        "././public/images/doctor/" + req.params.id + ".jpg",
        (error) => {
          res.json({ status: true });
        }
      );
    })
    .catch((error) => {
      res.json(error);
    });
});

router.get("/doctors/:name", verifyLogin, (req, res) => {
  adminHelpers.getOneDoctor(req.params.name).then((response) => {
    res.render("admin/edit-doctor", {
      title: "Edit Doctor",
      admin: req.admin,
      doctor: response,
    });
  });
});

router.post("/doctors/:name", verifyLogin, (req, res) => {
  adminHelpers.updateDoctor(req.params.name, req.body).then((response) => {
    res.redirect("/users");
  });
});

router.post("/add-patient", verifyLogin, (req, res) => {
  var format = /([0-9\+[1-9]{1}[0-9]{3,14})+$/;
  var cred = req.body.cred;
  if (format.test(cred)) {
    req.body.contactno = cred;
    delete req.body.cred;
  } else {
    req.body.email = cred;
    delete req.body.cred;
  }
  var to = req.body.email;
  var sub = "Added to Patient's List on Galaxieon Care";
  if (req.body.email) {
    password = generatePassword();
    req.body.password = password;
  }
  adminHelpers
    .addPatient(req.body)
    .then((response) => {
      if (req.body.email) {
        var output = `
      <h3>Hi, ${req.body.name}
      Greetings from Galaxieon Care</h3>

      <p>Admin Of Galaxieon Care added you to our patient's list .
      You can login to your  or your can login with your email and password
      Email: ${req.body.email}
      Password: ${password}</p>
      <a href="${process.env.USER_HOSTNAME}">Click To Login<a>
    `;
        sendMail(to, sub, output)
          .then((response) => {
            res.render("admin/success-page", {
              admin: req.admin,
              title: `${req.body.name} Added Sucessfully`,
              message: `Username and password was sent to the mail id  ${req.body.email}`,
            });
          })
          .catch((error) => {
            res.render("admin/success-page", {
              admin: req.admin,
              title: `${req.body.name} Added Sucessfully`,
              message: `Something Went Wrong on Sending Mail to ${req.body.email}`,
            });
          });
      } else {
        let no = req.body.contactno.substring(3, 13);
        var output = `
        Hi, ${req.body.name}
        Greetings from Galaxieon Care
      
        Admin Of Galaxieon Care added you to our patient's list .
        You can login to your  or your can login with your resitered mobile
        Registered Moblie No: ${req.body.contactno}
        To Login
        ${process.env.USER_HOSTNAME}
      `;
        sendMessage([no], output)
          .then((response) => {
            res.render("admin/success-page", {
              admin: req.admin,
              title: `${req.body.name} Added Sucessfully`,
              message: `Mesaage was sent to the regiested mobile ${req.body.contactno}`,
            });
          })
          .catch((error) => {
            res.render("admin/success-page", {
              admin: req.admin,
              title: `${req.body.name} Added Sucessfully`,
              message: `Something Went Wrong on Sending Message to ${req.body.contactno}`,
            });
          });
      }
    })
    .catch((error) => {
      req.session.adderror = error.msg;
      req.session.pateint = req.body;
      res.redirect("/add-patient");
    });
});

router.delete("/pateints/:id", verifyLogin, (req, res) => {
  adminHelpers
    .deletePateint(req.params.id)
    .then((response) => {
      res.json({ status: true });
    })
    .catch((error) => {
      res.json(error);
    });
});
router.get("/patients/:id", verifyLogin, (req, res) => {
  adminHelpers.getOnePatient(req.params.id).then((respone) => {
    res.render("admin/edit-patient", {
      admin: req.admin,
      patient: respone,
      title: "Edit Patient",
    });
  });
});

router.post("/patients/:id", verifyLogin, (req, res) => {
  adminHelpers.updatePatient(req.params.id, req.body).then((response) => {
    res.redirect("/users");
  });
});

router.post("/image/upload/:id", (req, res) => {
  let image = req.files.image;
  image.mv("./public/images/doctor/" + req.params.id + ".jpg", (err) => {
    if (err) {
      res.json({ status: false });
    } else {
      res.json({ status: true });
    }
  });
});

router.get("/image-upload/:id", verifyLogin, (req, res) => {
  res.render("admin/image-crop", {
    admin: req.admin,
    id: req.params.id,
    title: "Image Upload",
  });
});

router.put("/doctor/block/:id", (req, res) => {
  adminHelpers.blockDoctor(req.params.id, "Blocked").then((response) => {
    res.json(response);
  });
});
router.put("/patient/block/:id", (req, res) => {
  adminHelpers.blockPatient(req.params.id, "Blocked").then((response) => {
    res.json(response);
  });
});

router.get("/users/blocked", verifyLogin, async (req, res) => {
  let doctor = await adminHelpers.getBlockedDoctors();
  let patient = await adminHelpers.getBlockedPatients();
  res.render("admin/blocked-users", {
    title: "Blocked Users",
    admin: req.admin,
    search2: true,
    doctor,
    patient,
  });
});

router.put("/doctor/unblock/:id", (req, res) => {
  adminHelpers.blockDoctor(req.params.id, "Active").then((response) => {
    res.json(response);
  });
});
router.put("/patient/unblock/:id", (req, res) => {
  adminHelpers.blockPatient(req.params.id, "Active").then((response) => {
    res.json(response);
  });
});

router.get("/stats/:id", verifyLogin, async (req, res) => {
  let counts = await adminHelpers.getCountsOfAppontments(req.params.id);
  res.render("admin/stats", { title: "Stats", admin: req.admin, counts });
});

router.get("/search/users", async (req, res) => {
  let doctor = await adminHelpers.getDoctors();
  let patient = await adminHelpers.getPatients();
  const options1 = {
    includeScore: true,
    keys: ["name", "email", "username", "field", "specialised"],
  };
  const options2 = {
    includeScore: true,
    keys: ["name", "email", "contactno"],
  };
  const fuse1 = new Fuse(doctor, options1);
  const fuse2 = new Fuse(patient, options2);
  const result1 = fuse1.search(req.query.q);
  const result2 = fuse2.search(req.query.q);
  res.json({ result1, result2 });
});

router.get("/search/blocked", async (req, res) => {
  let doctor = await adminHelpers.getBlockedDoctors();
  let patient = await adminHelpers.getBlockedPatients();
  const options1 = {
    includeScore: true,
    keys: ["name", "email", "username", "field", "specialised"],
  };
  const options2 = {
    includeScore: true,
    keys: ["name", "email", "contactno"],
  };
  const fuse1 = new Fuse(doctor, options1);
  const fuse2 = new Fuse(patient, options2);
  const result1 = fuse1.search(req.query.q);
  const result2 = fuse2.search(req.query.q);
  res.json({ result1, result2 });
});

router.get("/search/:id", verifyLogin, async (req, res) => {
  let todaysAppointments = await adminHelpers.getTodaysAppointment(
    req.params.id
  );
  let upcomingAppointments = await adminHelpers.getUpcomingAppointments(
    req.params.id
  );
  let expiredAppointments = await adminHelpers.getExipredApointments(
    req.params.id
  );
  let cancelledAppointments = await adminHelpers.getCancelledAppointment(
    req.params.id
  );
  let consultedAppointments = await adminHelpers.getConsultedAppointments(
    req.params.id
  );
  const options = {
    includeScore: true,
    keys: [
      "date",
      "doctor.name",
      "doctor.email",
      "doctor.field",
      "doctor.specialised",
      "user.name",
      "user.email",
      "user.contactno",
      "timeslot",
    ],
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
  res.render("admin/search", {
    title: `${req.query.q} - Search`,
    admin: req.admin,
    search: true,
    searchId: req.params.id,
    query: req.query.q,
    result1,
    result2,
    result3,
    result4,
    result5,
  });
});

router.get("/profile/edit", verifyLogin, (req, res) => {
  adminHelpers.getMyProfile(req.admin.email).then((response) => {
    res.render("admin/edit-profile", {
      title: "Edit Profile",
      admin: req.admin,
      adminDetails: response,
    });
  });
});

router.post("/profile/edit/", verifyLogin, (req, res) => {
  adminHelpers.editProfile(req.admin._id, req.body).then((response) => {
    if (req.admin.email !== req.body.email) {
      res.clearCookie("adminToken");
      res.render("admin/message", {
        title: "Email Id Changed",
        message: "Re Authentication Required",
      });
    } else {
      adminHelpers.getMyProfile(req.body.email).then((response) => {
        delete response.password;
        var token = jwt.sign(response, process.env.JWT_SECERT, {
          expiresIn: "10d",
        });
        res.cookie("adminToken", token, {
          httpOnly: true,
          expires: new Date(Date.now() + 864000000),
          secure: process.env.NODE_ENV === "production" ? true : false,
        });
        res.redirect("/myprofile");
      });
    }
  });
});

router.get("/profile/change-password", verifyLogin, async (req, res) => {
  let profileDetails = await adminHelpers.getMyProfile(req.admin.email);
  var payload = {
    id: req.admin._id,
  };
  var token = jwt.sign(payload, process.env.JWT_RESET_PASSWORD, {
    expiresIn: "5m",
  });
  var template = `
    <h2>Change Password</h2>
    <a href="${process.env.ADMIN_HOSTNAME}/profile/change-password/${token}">${process.env.ADMIN_HOSTNAME}/profile/change-password/${token}</a>
    `;
  sendMail(profileDetails.email, "Change Password", template);
  res.render("admin/password-message", {
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
        res.render("admin/password-message", {
          title: "Link Exipred",
          message: `The link was exipred the link is only valid for 5 Minutes`,
        });
      } else {
        console.log(decoded);
        res.render("admin/change-password", {
          title: "New Password",
          id: decoded.id,
        });
      }
    }
  );
});

router.post("/profile/change-password", (req, res) => {
  adminHelpers.changePassword(req.body).then((response) => {
    res.clearCookie("adminToken");
    res.redirect("/");
  });
});

router.get("/stats-report/:id", async (req, res) => {
  let patients = await adminHelpers.getMyPatients(
    req.params.id,
    req.query.date
  );
  adminHelpers
    .getDoctorStats(req.params.id, req.query.date, patients)
    .then((response) => {
      res.json(response);
    });
});

module.exports = router;
