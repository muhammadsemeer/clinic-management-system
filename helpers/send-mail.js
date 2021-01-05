require("dotenv").config();

module.exports.sendMail = (to, sub, output) => {
  return new Promise((resolve, reject) => {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: to, // Change to your recipient
      from: process.env.FROM_MAIL, // Change to your verified sender
      subject: sub,
      html: output,
    };

    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
        resolve();
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
};
