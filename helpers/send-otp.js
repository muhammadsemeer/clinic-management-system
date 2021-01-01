require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

module.exports = {
  sendOTP: (number) => {
    return new Promise((resolve, reject) => {
      client.verify
        .services(process.env.TWILIO_SERVICE_SSID)
        .verifications.create({ to: number, channel: "sms" })
        .then((verification) => {
          resolve();
        })
        .catch((error) => {
          reject();
        });
    });
  },
  verfiyOTP: (number, code) => {
    return new Promise((resolve, reject) => {
      client.verify
        .services(process.env.TWILIO_SERVICE_SSID)
        .verificationChecks.create({ to: number, code: code })
        .then((verification_check) => {
          if (verification_check.valid) {
            resolve();
          } else {
            reject({ msg: "Invalid Code" });
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
};
