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
            reject({ msg: "Invalid Email Or Password" });
          }
        });
      } else {
        reject({ msg: "Invalid Email Or Password" });
      }
    });
  },
  addDoctor: (details) => {
    return new Promise(async (resolve, reject) => {
      details.status = "Active";
      let emailFound = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({ email: details.email })
        .toArray();
      if (emailFound.length <= 0) {
        details.password = await bcrypt.hash(details.password, 10);
        db.get()
          .collection(collection.DOCTORS_COLLECTION)
          .insertOne(details)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
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
        .updateOne(
          { _id: ObjectId(doctorId) },
          {
            $set: {
              status: "Deleted",
            },
          }
        )
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
  addPatient: (details) => {
    return new Promise(async (resolve, reject) => {
      let mailFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $or: [{ email: details.email }, { contactno: details.contactno }],
        })
        .toArray();
      if (mailFound <= 0) {
        details.password = await bcrypt.hash(details.password, 10);
        db.get()
          .collection(collection.PATIENT_COLLECTION)
          .insertOne(details)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        reject({ msg: "Email Id or Mobile already Registered" });
      }
    });
  },
  getPatients: () => {
    return new Promise(async (resolve, reject) => {
      let pateints = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find()
        .toArray();
      resolve(pateints);
    });
  },
};
