const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

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
  otpLogin: (number) => {
    return new Promise(async (resolve, reject) => {
      let mobileFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $and: [
            { contactno: number },
            { auth: "Password" },
            { status: "Active" },
          ],
        })
        .toArray();
      if (mobileFound.length <= 0) {
        reject({ msg: "Inavild Email or Mobile No" });
      } else {
        resolve(mobileFound[0]);
      }
    });
  },
  getBookingDoctor: (doctorid) => {
    return new Promise(async (resolve, reject) => {
      let docotor = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne({ _id: ObjectId(doctorid) });
      resolve(docotor);
    });
  },
  bookApointment: (doctor, user, details) => {
    return new Promise(async (resolve, reject) => {
      let busySchedule = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .find({
          $and: [
            { doctor: ObjectId(doctor) },
            { date: details.date },
            { timeslot: details.timeslot },
          ],
        })
        .toArray();
      if (busySchedule.length <= 0) {
        db.get()
          .collection(collection.APPOINTMENT_COLLECTION)
          .insertOne({
            doctor: ObjectId(doctor),
            user: ObjectId(user),
            date: details.date,
            timeslot: details.timeslot,
            status: "Pending",
          })
          .then((response) => {
            resolve(response.ops[0]);
          });
      } else {
        reject({
          msg: `${details.timeslot} is not available on ${details.date}`,
        });
      }
    });
  },
  getBusySlots: (date) => {
    return new Promise(async (resolve, reject) => {
      date = new Date(date).toDateString();
      let busySlots = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .find({ date: date }, { projection: { timeslot: 1, _id: 0 } })
        .toArray();
      resolve(busySlots);
    });
  },
  getMyAppointments: (userId) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ user: ObjectId(userId) }, { status: "Approved" }],
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
            $unwind: "$doctor",
          },
        ])
        .toArray();
      resolve(appointment);
    });
  },
  getMyRequests: (userId) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ user: ObjectId(userId) }, { status: "Pending" }],
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
            $unwind: "$doctor",
          },
        ])
        .toArray();
      resolve(appointment);
    });
  },
  cancelAppointment: (id) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
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
  getCancelledAppoinmetns: (id) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ user: ObjectId(id) }, { status: "Deleted" }],
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
            $unwind: "$doctor",
          },
        ])
        .toArray();
      resolve(appointment);
    });
  },
};
