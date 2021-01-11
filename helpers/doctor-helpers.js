const db = require("../config/connection");
const collection = require("../config/collection");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { sendMail } = require("./send-mail");
const { sendMessage } = require("./sms-send");

module.exports = {
  dologin: (deatils) => {
    return new Promise(async (resolve, reject) => {
      let emailFound = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({
          $and: [
            { username: deatils.usrname },
            { $or: [{ status: "Active" }, { status: "Blocked" }] },
          ],
        })
        .toArray();
      if (emailFound.length > 0) {
        if (emailFound[0].status === "Blocked") {
          reject({ msg: "Your Account is temporarliy disbaled" });
        }
        bcrypt
          .compare(deatils.password, emailFound[0].password)
          .then((status) => {
            if (status) {
              resolve(emailFound[0]);
            } else {
              reject({ msg: "Invalid Username or Password" });
            }
          })
          .catch((err) => {
            if (err) throw err;
          });
      } else {
        reject({ msg: "Invalid Username or Password" });
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
      bookings.forEach((element) => {
        var today = new Date();
        today = new Date(today).setHours(0,0,0,0);
        var dbDate = new Date(element.date);
        if (dbDate >= today) {
          result.push(element);
        }
      });
      console.log(result, "result");
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
  getUpcomingAppointmentsByDate: (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
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
      let result = [];
      appointment.forEach((element) => {
        var today = new Date();
        var dbDate = new Date(element.date);
        if (dbDate > today) {
          result.push(element);
        }
      });
      console.log(appointment);
      resolve(result);
    });
  },
  getExipredApointmentsByDate: (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { doctor: ObjectId(doctorId) },
                { status: { $ne: "Deleted" } },
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
  getCancelledAppointmentByDate: (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { doctor: ObjectId(doctorId) },
                { status: "Deleted" },
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
        ])
        .toArray();
      var result = [];
      if (patients.length != 0) {
        var id = patients[0].uniqueIds;
        for (let i = 0; i < id.length; i++) {
          result[i] = await db
            .get()
            .collection(collection.PATIENT_COLLECTION)
            .findOne({ _id: ObjectId(id[i]) });
        }
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
      let blocked = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne(
          { _id: ObjectId(doctorId) },
          {
            projection: { _id: 0, blockedUsers: 1 },
          }
        );
      let result = patients;
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
            if (blocked.blockedUsers[j] == patients[i]._id) {
              result.splice(i, 1);
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
      let profile = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne({ _id: ObjectId(doctorId) });
      resolve(profile);
    });
  },
  getMyProfileEmail: (email) => {
    return new Promise(async (resolve, reject) => {
      let profile = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({ email: email })
        .toArray();
      if (profile.length > 0) {
        resolve(profile[0]);
      } else {
        reject({ msg: "User Not Found" });
      }
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
  getAppointmentDetails: (appId) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ _id: ObjectId(appId) }],
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
      resolve(appointment[0]);
    });
  },
  addPrescription: (appId, medicines, notes) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .updateOne(
          { _id: ObjectId(appId) },
          {
            $set: {
              medicines,
              notes,
              status: "Consulted",
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getConsultedAppointments: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ doctor: ObjectId(doctorId) }, { status: "Consulted" }],
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
  getConsultedAppointmentsByDate: (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { doctor: ObjectId(doctorId) },
                { status: "Consulted" },
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
  getPatientHistory: (doctorId, userId) => {
    return new Promise(async (resolve, reject) => {
      let history = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { doctor: ObjectId(doctorId) },
                { user: ObjectId(userId) },
                { status: "Consulted" },
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
      resolve(history);
    });
  },
  changePassword: (details) => {
    return new Promise(async (resolve, reject) => {
      details.password = await bcrypt.hash(details.password, 10);
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .updateOne(
          { _id: ObjectId(details.id) },
          {
            $set: {
              password: details.password,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  sendInfo: (appId, status) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              _id: ObjectId(appId),
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
            $lookup: {
              from: collection.DOCTORS_COLLECTION,
              localField: "doctor",
              foreignField: "_id",
              as: "doctor",
            },
          },
          {
            $unwind: "$user",
          },
          {
            $unwind: "$doctor",
          },
        ])
        .toArray();
      var template = `
        Hi, ${appointment[0].user.name},

        Your Booking is ${status} By ${appointment[0].doctor.name}
        Booking Date: ${appointment[0].date}
        Booking Time: ${appointment[0].timeslot}
        
        Thank You 
        Galaxieon Care
        `;
      var emailTemplate = `
        <h4>Hi, ${appointment[0].user.name},</h4>
        <h4>Your Booking is ${status} By ${appointment[0].doctor.name}</h4>
        <h4>Booking Date: ${appointment[0].date}</h4>
        <h4>Booking Time: ${appointment[0].timeslot}</h4>
        <h4>Thank You </h4>
        <h4>Galaxieon Care </h4>
        `;
      if (appointment[0].user.email) {
        sendMail(
          appointment[0].user.email,
          `Booking ${status}`,
          emailTemplate
        ).then((response) => {
          resolve(response);
        });
      } else {
        sendMessage(
          [appointment[0].user.contactno.substring(3, 13)],
          template
        ).then((response) => {
          resolve(response);
        });
      }
    });
  },
  checkUserStatus: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne({
          _id: ObjectId(doctorId),
        });
      if (user.status === "Active") {
        resolve();
      } else {
        reject();
      }
    });
  },
};
