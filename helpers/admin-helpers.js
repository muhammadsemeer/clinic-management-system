const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

module.exports = {
  doLogin: (Data) => {
    return new Promise(async (resolve, reject) => {
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: Data.email });
      if (admin) {
        bcrypt.compare(Data.password, admin.password).then((status) => {
          if (status) {
            resolve(admin);
          } else {
            reject({ msg: "Invalid Password" });
          }
        });
      } else {
        reject({ msg: "Invalid Email" });
      }
    });
  },
  addDoctor: (details) => {
    return new Promise(async (resolve, reject) => {
      console.log("here 1");
      details.status = "Active";
      details.password = await bcrypt.hash(details.password, 10);
      let emailFound = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({ email: details.email })
        .toArray();
      if (emailFound.length <= 0) {
        console.log("here 2");
        db.get()
          .collection(collection.DOCTORS_COLLECTION)
          .insertOne(details)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        console.log("here 3");
        reject({ msg: "Email Id Already Exists" });
      }
    });
  },
  getDoctors: () => {
    return new Promise(async (resolve, reject) => {
      let doctors = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find()
        .toArray();
      resolve(doctors);
    });
  },
  checkUsername: (username) => {
    return new Promise(async (resolve, reject) => {
      let userNameDb = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({ username: username })
        .toArray();
      if (userNameDb.length > 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  },
  deleteDoctor: (doctorId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .removeOne({ _id: ObjectId(doctorId) })
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getOneDoctor: (username) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne({ username: username })
        .then((response) => {
          resolve(response);
        });
    });
  },
  updateDoctor: (username, details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .updateOne(
          { username: username },
          {
            $set: {
              name: details.name,
              email: details.email,
              specialised: details.specialised,
              field: details.field,
              gender: details.gender,
            },
          }
        )
        .then((respone) => {
          resolve();
        });
    });
  },
};
