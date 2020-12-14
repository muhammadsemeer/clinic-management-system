const db = require("../config/connection");
const collection = require("../config/collection");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

module.exports = {
  dologin: (deatils) => {
    return new Promise(async (resolve, reject) => {
      let emailFound = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({ $and: [{ username: deatils.usrname }, { status: "Active" }] })
        .toArray();
      if (emailFound.length > 0) {
        bcrypt
          .compare(deatils.password, emailFound[0].password)
          .then((status) => {
            if (status) {
              resolve(emailFound[0]);
            } else {
              reject({ msg: "Invalid Email or Password" });
            }
          })
          .catch((err) => {
            if (err) throw err;
          });
      } else {
        reject({ msg: "Invalid Email or Password" });
      }
    });
  },
  getMybookings: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let bookings = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ doctor: ObjectId(doctorId) }, { status: "Pending" }],
            },
          },
          {
            $lookup: {
              from: collection.PATIENT_COLLECTION,
              localField: "user",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
        ])
        .toArray();
      resolve(bookings);
    });
  },
};
