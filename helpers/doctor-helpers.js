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
      let result = [];
      console.log(bookings);
      bookings.forEach((element) => {
        var today = new Date().toDateString();
        var dbDate = new Date(element.date).toDateString();
        if (
          dbDate >= today
        ) {
          result.push(element);
        }
      });
      resolve(result);
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
  getMyPatients: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let patients = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ doctor: ObjectId(doctorId) }],
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
          {
            $project: {
              _id: 0,
              user: 1,
            },
          },
          {
            $group: {
              _id: null,
              uniqueIds: { $addToSet: "$user._id" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ])
        .toArray();
      var id = patients[0].uniqueIds;
      var result = [];
      for (let i = 0; i < id.length; i++) {
        result[i] = await db
          .get()
          .collection(collection.PATIENT_COLLECTION)
          .findOne({ _id: ObjectId(id[i]) });
      }
      resolve(result);
    });
  },
  blockPatient: (doctorId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .updateOne(
          { _id: ObjectId(doctorId) },
          {
            $push: { blockedUsers: userId },
          }
        )
        .then((response) => {
          resolve(true);
        });
    });
  },
  removeBlocked: (doctorId, patients) => {
    return new Promise(async (resolve, reject) => {
      console.log(patients);
      let blocked = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne(
          { _id: ObjectId(doctorId) },
          {
            projection: { _id: 0, blockedUsers: 1 },
          }
        );
      let result = [];
      if (blocked.blockedUsers.length === patients.length) {
        return resolve();
      }
      for (let i = 0; i < patients.length; i++) {
        if (
          !(
            Object.keys(blocked).length === 0 && blocked.constructor === Object
          ) &&
          blocked.blockedUsers.length != 0
        ) {
          for (let j = 0; j < blocked.blockedUsers.length; j++) {
            if (blocked.blockedUsers[j] != patients[i]._id) {
              result.push(patients[i]);
            }
          }
        } else {
          result = patients;
        }
      }
      resolve(result);
    });
  },
  getBlocked: (doctorId, patients) => {
    return new Promise(async (resolve, reject) => {
      let blocked = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne(
          { _id: ObjectId(doctorId) },
          {
            projection: { _id: 0, blockedUsers: 1 },
          }
        );
      let result = [];
      for (let i = 0; i < patients.length; i++) {
        if (
          !(Object.keys(blocked).length === 0 && blocked.constructor === Object)
        ) {
          for (let j = 0; j < blocked.blockedUsers.length; j++) {
            if (blocked.blockedUsers[j] == patients[i]._id) {
              result.push(patients[i]);
            }
          }
        }
      }
      resolve(result);
    });
  },
  unBlock: (doctorId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .updateOne(
          { _id: ObjectId(doctorId) },
          {
            $pull: { blockedUsers: userId },
          }
        )
        .then((response) => {
          resolve(true);
        });
    });
  },
  getMyProfile: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let profile = db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne({ _id: ObjectId(doctorId) });
      resolve(profile);
    });
  },
  checkUsername: (username, currentUsername) => {
    return new Promise(async (resolve, reject) => {
      let userNameDb = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({
          $and: [
            { username: username },
            { status: "Active" },
            { username: { $ne: currentUsername } },
          ],
        })
        .toArray();
      if (userNameDb.length > 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  },
  editProfileDeatils: (id, deatils) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              name: deatils.name,
              email: deatils.email,
              specialised: deatils.specialised,
              field: deatils.field,
              gender: deatils.gender,
            },
          }
        )
        .then((res) => {
          resolve();
        });
    });
  },
  editUsername: (id, name) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              username: name,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getMySlotConfig: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let slotConfig = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne(
          { _id: ObjectId(doctorId) },
          {
            projection: { _id: 0, slotConfig: 1 },
          }
        );
      resolve(slotConfig);
    });
  },
  upadateSlotConfig: (doctorId, slotConfig) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .updateOne(
          { _id: ObjectId(doctorId) },
          {
            $set: {
              slotConfig: slotConfig,
            },
          }
        );
      resolve();
    });
  },
};
