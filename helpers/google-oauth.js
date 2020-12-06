const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);
module.exports = {
  verify: (token) => {
    return new Promise(async (resolve, reject) => {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      resolve(payload)
    });
  },
};
