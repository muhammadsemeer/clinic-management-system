const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");

module.exports = {
  doSignup: (details) => {
    return new Promise(async (resolve, reject) => {
      let mailFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $and: [
            {
              $or: [{ email: details.email }, { contactno: details.contactno }],
            },
            { status: "Active" },
          ],
        })
        .toArray();
      if (mailFound.length <= 0) {
        details.status = "Active";
        details.password = await bcrypt.hash(details.password, 10);
        db.get()
          .collection(collection.PATIENT_COLLECTION)
          .insertOne(details)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        reject({ msg: "Email Id or Contact No Already Exists" });
      }
    });
  },
  OAuth: (details, OAuth) => {
    return new Promise(async (resolve, reject) => {
      let mailFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $and: [
            {
              email: details.email,
            },
            { status: "Active" },
            { auth: OAuth },
          ],
        })
        .toArray();
      if (mailFound.length <= 0) {
        details.status = "Active";
        details.auth = OAuth;
        delete details.authtoken;
        db.get()
          .collection(collection.PATIENT_COLLECTION)
          .insertOne(details)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        resolve(mailFound[0]);
      }
    });
  },
};
