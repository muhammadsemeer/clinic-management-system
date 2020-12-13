const db = require("../config/connection");
const collection = require("../config/collection");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

module.exports = {
  getTodaysAppointemnts: () => {
    return new Promise(async (resolve, rejetct) => {
      let date = new Date().toDateString();
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: { date: date },
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
      resolve(appointment);
    });
  },
  getUpcomingAppointemnts: () => {
    return new Promise(async (resolve, rejetct) => {
      let date = new Date().toDateString();
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: { date: { $ne: date } },
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
      resolve(appointment);
    });
  },
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
};
