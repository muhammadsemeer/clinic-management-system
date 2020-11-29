const fast2sms = require("fast-two-sms");
require("dotenv").config();
module.exports.sendMessage = (to, message) => {
  return new Promise((resolve, reject) => {
    var options = {
      authorization: process.env.SMS_API_KEY,
      message: message,
      numbers: to,
    };
    fast2sms
      .sendMessage(options)
      .then((response) => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};
