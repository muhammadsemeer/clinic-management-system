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
  changeBookingStatus: (bookingId, status) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .updateOne(
          { _id: ObjectId(bookingId) },
          {
            $set: {
              status: status,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getTodaysAppointment: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let date = new Date().toDateString();
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { doctor: ObjectId(doctorId) },
                { status: "Approved" },
                { date: date },
              ],
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
      resolve(appointment);
    });
  },
  getUpcomingAppointments: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let date = new Date().toDateString();
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { doctor: ObjectId(doctorId) },
                { status: "Approved" },
                { date: { $ne: date } },
              ],
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
      let result = [];
      appointment.forEach((element) => {
        var today = new Date();
        var dbDate = new Date(element.date);
        if (dbDate > today) {
          result.push(element);
        }
      });
      resolve(result);
    });
  },
  getExipredApointments: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let date = new Date().toDateString();
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { doctor: ObjectId(doctorId) },
                { status: { $ne: "Deleted" } },
                { date: { $ne: date } },
              ],
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
      let result = [];
      appointment.forEach((element) => {
        var today = new Date();
        var dbDate = new Date(element.date);
        if (dbDate < today) {
          result.push(element);
        }
      });
      resolve(result);
    });
  },
  getCancelledAppointment: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ doctor: ObjectId(doctorId) }, { status: "Deleted" }],
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
      resolve(appointment);
    });
  },
};
