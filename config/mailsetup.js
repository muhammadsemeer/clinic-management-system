const nodemailer = require("nodemailer");
require("dotenv").config();
module.exports.transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASS,
  },
});
