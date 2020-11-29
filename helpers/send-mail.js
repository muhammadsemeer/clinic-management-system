const { transporter } = require("../config/mailsetup");
require("dotenv").config();

module.exports.sendMail = (to, sub, output) => {
  return new Promise((resolve, reject) => {
    let mailOptions = {
      from: process.env.FROMMAIL,
      to: to,
      subject: sub,
      text: output,
    };
    transporter.sendMail(mailOptions, (error, data) => {
      if (error) return reject(error);
      resolve(data);
    });
  });
};
