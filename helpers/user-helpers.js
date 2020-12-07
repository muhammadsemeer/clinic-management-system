const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");
const e = require("express");

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
        details.auth = "Password";
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
      } else if (mailFound[0].auth === OAuth) {
        resolve(mailFound[0]);
      } else {
        reject({ msg: "Email Id Alreday Registered" });
      }
    });
  },
  checkEmail: (email) => {
    return new Promise(async (resolve, reject) => {
      let emailFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $and: [{ email: email }, { auth: "Password" }, { status: "Active" }],
        })
        .toArray();
      if (emailFound.length <= 0) {
        reject({ msg: "No User Found" });
      } else {
        resolve(emailFound[0].email);
      }
    });
  },
  checkMobile: (mobileno) => {
    return new Promise(async (resolve, reject) => {
      let mobileFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $and: [
            { contactno: mobileno },
            { auth: "Password" },
            { status: "Active" },
          ],
        })
        .toArray();
      if (mobileFound.length <= 0) {
        reject({ msg: "Inavild Email or Mobile No" });
      } else {
        resolve(mobileFound[0].contactno);
      }
    });
  },
  passwordLogin: (details) => {
    return new Promise(async (resolve, reject) => {
      console.log(details.email);
      let emailFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({ $and: [{ email: details.email }, { auth: "Password" }] })
        .toArray();
      if (emailFound.length <= 0) {
        reject({ msg: "Invalid Password" });
      } else {
        bcrypt
          .compare(details.password, emailFound[0].password)
          .then((status) => {
            if (status) {
              resolve(emailFound[0]);
            } else {
              reject({ msg: "Invalid Password" });
            }
          });
      }
    });
  },
};
