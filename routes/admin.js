var express = require("express");
var router = express.Router();
const adminHelpers = require("../helpers/admin-helpers");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../helpers/send-mail");
const { sendMessage } = require("../helpers/sms-send");
const fs = require("fs");
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
        expiresIn: "60d",
      });
      res.cookie("adminToken", token, {
        httpOnly: true,
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
    doctor,
    patient,
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
  Hi, ${req.body.name}
  Greetings from Galaxieon Care

  ${req.admin.name} added you to our doctor's list.
  You can login to your doctor accout with your username and password that created by ${req.admin.name}

  Username: ${req.body.username}
  Password: ${req.body.password}
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
  var to = req.body.email;
  var sub = "Added to Patient's List on Galaxieon Care";
  var output = `
  Hi, ${req.body.name}
  Greetings from Galaxieon Care

  ${req.admin.name} added you to our patient's list .
  You can login to your accout with your email and password that created by ${req.admin.name} or your can login with your resitered mobile

  Registered Moblie No: ${req.body.contactno}
  Password: ${req.body.password}
`;
  adminHelpers
    .addPatient(req.body)
    .then((response) => {
      sendMail(to, sub, output)
        .then((response) => {
          sendMessage([req.body.contactno], output)
            .then((response) => {
              res.render("admin/success-page", {
                admin: req.admin,
                title: `${req.body.name} Added Sucessfully`,
                message: `Username and password was sent to the mail id  ${req.body.email} and regiested mobile ${req.body.contactno}`,
              });
            })
            .catch((error) => {
              res.render("admin/success-page", {
                admin: req.admin,
                title: `${req.body.name} Added Sucessfully`,
                message: `Something Went Wrong on Sending Message to ${req.body.contactno}`,
              });
            });
        })
        .catch((error) => {
          res.render("admin/success-page", {
            admin: req.admin,
            title: `${req.body.name} Added Sucessfully`,
            message: `Something Went Wrong on Sending Mail to ${req.body.email}`,
          });
        });
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

router.post("/doctor/upload/:id", (req, res) => {
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
  adminHelpers.blockDoctor(req.params.id).then((response) => {
    res.json(response)
  })
});
router.put("/patient/block/:id", (req, res) => {
  adminHelpers.blockPatient(req.params.id).then((response) => {
    res.json(response)
  })
});

module.exports = router;
