var express = require("express");
var router = express.Router();
const adminHelpers = require("../helpers/admin-helpers");
const jwt = require("jsonwebtoken");
const { response } = require("express");
require("dotenv").config();

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
  res.render("admin/patients", { title: "Pateints", admin: req.admin });
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
  });
  req.session.adderror = null;
});

router.get("/add-patient", verifyLogin, (req, res) => {
  res.render("admin/add-patient", { title: "Add Patient", admin: req.admin });
});

router.post("/add-doctor", verifyLogin, (req, res) => {
  adminHelpers
    .addDoctor(req.body)
    .then((response) => {
      res.redirect("/doctors");
    })
    .catch((error) => {
      req.session.adderror = error.msg;
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

module.exports = router;
