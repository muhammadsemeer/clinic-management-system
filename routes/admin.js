var express = require("express");
var router = express.Router();
const adminHelpers = require("../helpers/admin-helpers");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../helpers/send-mail");

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
router.get("/", verifyLogin, function (req, res, next) {
  res.render("admin/index", { title: "Dashboard", admin: req.admin });
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
        expiresIn: "60d",
      });
      res.cookie("adminToken", token);
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

router.get("/doctors", verifyLogin, (req, res) => {
  adminHelpers.getDoctors().then((response) => {
    res.render("admin/doctors", {
      title: "Doctors",
      admin: req.admin,
      doctor: response,
    });
  });
});

router.get("/pateints", verifyLogin, (req, res) => {
  adminHelpers.getPatients().then((response) => {
    res.render("admin/patients", {
      title: "Pateints",
      admin: req.admin,
      pateint: response,
    });
  });
});

router.get("/appointment", verifyLogin, (req, res) => {
  res.render("admin/appointment", { title: "Appointment", admin: req.admin });
});

router.get("/myprofile", verifyLogin, (req, res) => {
  res.render("admin/profile", { title: "My Profile", admin: req.admin });
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
  var to = req.body.email;
  var sub = "Added to Doctor's List on Galaxieon Care";
  var output = `
  <body style="background-color: #19b9ec; text-align: center; color: #ffffff"; padding: 25px>
  <h1>Hi, ${req.body.name}</h1>
  <h2>Greetings from Galaxieon Care</h2>
  <h3>
  ${req.admin.name} added you to our doctor's list <br>
  You can login to your doctor accout with your username and password that 
  created by ${req.admin.name}
  </h3>
  <h3>Username: ${req.body.username}</h3>
  <h3>Password: ${req.body.password}</h3>
  </body>
`;
  adminHelpers
    .addDoctor(req.body)
    .then((response) => {
      sendMail(to, sub, output)
        .then((response) => {
          res.render("admin/success-page", {
            admin: req.admin,
            title: `${req.body.name} Added Sucessfully`,
            message: `Username and password was sent to the mail id ${req.body.email}`,
            to: "/doctors",
          });
        })
        .catch((error) => {
          res.render("admin/success-page", {
            admin: req.admin,
            title: `${req.body.name} Added Sucessfully`,
            message: `Something Went Wrong on Sending Mail to ${req.body.email}`,
            to: "/doctors",
          });
        });
    })
    .catch((error) => {
      req.session.adderror = error.msg;
      req.session.doctor = req.body;
      res.redirect("/add-doctor");
    });
});

router.get("/username/:name", (req, res) => {
  adminHelpers.checkUsername(req.params.name).then((response) => {
    res.json(response);
  });
});

router.delete("/doctors/:id", (req, res) => {
  adminHelpers
    .deleteDoctor(req.params.id)
    .then((response) => {
      res.json({ status: true });
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
    res.redirect("/doctors");
  });
});

router.post("/add-patient", verifyLogin, (req, res) => {
  var to = req.body.email;
  var sub = "Added to Patient's List on Galaxieon Care";
  var output = `
  <body style="background-color: #19b9ec; text-align: center; color: #ffffff"; padding: 25px>
  <h1>Hi, ${req.body.name}</h1>
  <h2>Greetings from Galaxieon Care</h2>
  <h3>
  ${req.admin.name} added you to our patient's list <br>
  You can login to your accout with your email and password that 
  created by ${req.admin.name} or your can login with your resitered mobile
  </h3>
  <h3>Registered Moblie No: ${req.body.contactno}</h3>
  <h3>Password: ${req.body.password}</h3>
  </body>
`;
  adminHelpers
    .addPatient(req.body)
    .then((response) => {
      sendMail(to, sub, output)
        .then((response) => {
          res.render("admin/success-page", {
            admin: req.admin,
            title: `${req.body.name} Added Sucessfully`,
            message: `Username and password was sent to the mail id ${req.body.email}`,
            to: "/pateints",
          });
        })
        .catch((error) => {
          res.render("admin/success-page", {
            admin: req.admin,
            title: `${req.body.name} Added Sucessfully`,
            message: `Something Went Wrong on Sending Mail to ${req.body.email}`,
            to: "/doctors",
          });
        });
    })
    .catch((error) => {
      req.session.adderror = error.msg;
      req.session.pateint = req.body;
      res.redirect("/add-patient");
    });
});

module.exports = router;
