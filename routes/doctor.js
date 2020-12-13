var express = require("express");
const doctorHelpers = require("../helpers/doctor-helpers");
var router = express.Router();

router.get("/", async (req, res) => {
  let todaysAppoitnment = await doctorHelpers.getTodaysAppointemnts();
  let upcomingAppointments = await doctorHelpers.getUpcomingAppointemnts();
  res.render("doctor/index", {
    title: "Doctor Dashboard",
    todaysAppoitnment,
    upcomingAppointments,
  });
});

router.get("/login", (req, res) => {
  res.render("doctor/login", { title: "Doctor Login" });
});

module.exports = router;
