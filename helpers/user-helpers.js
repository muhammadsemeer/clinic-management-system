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
            { $or: [{ status: "Active" }, { status: "Blocked" }] },
          ],
        })
        .toArray();
      if (mailFound.length <= 0) {
        details.status = "Active";
        details.auth = "Password";
        if (details.password) {
          details.password = await bcrypt.hash(details.password, 10);
        }
        db.get()
          .collection(collection.PATIENT_COLLECTION)
          .insertOne(details)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        if (mailFound.length !== 0 && mailFound[0].status === "Blocked") {
          reject({ msg: "Your Account is temporarliy disbaled" });
        } else {
          reject({ msg: "Email Id or Contact No Already Exists" });
        }
      }
    });
  },
  OAuth: (details, OAuth) => {
    return new Promise(async (resolve, reject) => {
      let mailFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $or: [
            {
              $and: [
                {
                  email: details.email,
                },
                { $or: [{ status: "Active" }, { status: "Blocked" }] },
              ],
            },
          ],
        })
        .toArray();
      if (mailFound.length <= 0) {
        if (mailFound.length !== 0 && mailFound[0].status === "Blocked") {
          reject({ msg: "Your Account is temporarliy disbaled" });
        }
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
        if (mailFound[0].status === "Blocked") {
          reject({ msg: "Your Account is temporarliy disbaled" });
        }
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
          $and: [
            { email: email },
            { auth: "Password" },
            { $or: [{ status: "Active" }, { status: "Blocked" }] },
          ],
        })
        .toArray();
      if (emailFound.length <= 0) {
        reject({ msg: "No User Found" });
      } else {
        if (emailFound[0].status === "Blocked") {
          reject({ msg: "Your Account is temporarliy disbaled" });
        }
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
            { $or: [{ status: "Active" }, { status: "Blocked" }] },
          ],
        })
        .toArray();
      if (mobileFound.length <= 0) {
        reject({ msg: "Inavild Email or Mobile No" });
      } else {
        if (mobileFound[0].status === "Blocked") {
          reject({ msg: "Your Account is temporarliy disbaled" });
        }
        resolve(mobileFound[0].contactno);
      }
    });
  },
  passwordLogin: (details) => {
    return new Promise(async (resolve, reject) => {
      let emailFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $and: [
            { email: details.email },
            { auth: "Password" },
            { status: "Active" },
          ],
        })
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
            { status: { $ne: "Deleted" } },
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
        .find(
          { $and: [{ date: date }, { status: { $ne: "Deleted" } }] },
          { projection: { timeslot: 1, _id: 0 } }
        )
        .toArray();
      resolve(busySlots);
    });
  },
  getMyAppointments: (userId, status) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ user: ObjectId(userId) }, { status: status }],
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
  getMyAppointmentsByDate: (userId, status, date) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { user: ObjectId(userId) },
                { status: status },
                { date: date },
              ],
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
  getMyProfile: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PATIENT_COLLECTION)
        .findOne({ _id: ObjectId(id) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getMyProfileEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PATIENT_COLLECTION)
        .findOne({ email: email })
        .then((response) => {
          resolve(response);
        });
    });
  },
  checkBlocked: (doctorId, userId) => {
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
      if (
        !(
          Object.keys(blocked).length === 0 && blocked.constructor === Object
        ) &&
        blocked.blockedUsers.length != 0
      ) {
        let check = blocked.blockedUsers.findIndex(
          (element) => element == userId
        );
        if (check !== -1) {
          reject({ msg: "Your unable to book appointment" });
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  },
  editPofrile: (user, details) => {
    return new Promise(async (resolve, reject) => {
      if (
        user.email === details.email ||
        user.contactno === details.contactno
      ) {
        db.get()
          .collection(collection.PATIENT_COLLECTION)
          .updateOne(
            { _id: ObjectId(user._id) },
            {
              $set: {
                name: details.name,
                email: details.email,
                contactno: details.contactno,
                age: details.age,
                gender: details.gender,
              },
            }
          )
          .then((response) => {
            resolve();
          });
      } else {
        let email = await db
          .get()
          .collection(collection.PATIENT_COLLECTION)
          .find({
            $and: [
              {
                $or: [
                  { email: details.email },
                  { contactno: details.contactno },
                ],
              },
              {
                status: "Active",
              },
            ],
          })
          .toArray();
        if (email.length != 0) {
          db.get()
            .collection(collection.PATIENT_COLLECTION)
            .updateOne(
              { _id: ObjectId(user._id) },
              {
                $set: {
                  name: details.name,
                  email: details.email,
                  contactno: details.contactno,
                  age: details.age,
                  gender: details.gender,
                },
              }
            )
            .then((response) => {
              resolve();
            });
        } else {
          reject({ msg: "Email Id or Contact No Already Exist" });
        }
      }
    });
  },
  changePassword: (details) => {
    return new Promise(async (resolve, reject) => {
      details.password = await bcrypt.hash(details.password, 10);
      db.get()
        .collection(collection.PATIENT_COLLECTION)
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
  getMyDoctors: (userId) => {
    return new Promise(async (resolve, reject) => {
      let doctors = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ user: ObjectId(userId) }, { status: "Consulted" }],
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
          {
            $project: {
              _id: 0,
              doctor: 1,
            },
          },
          {
            $group: {
              _id: null,
              uniqueIds: { $addToSet: "$doctor._id" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();
      var result = [];
      if (doctors.length != 0) {
        var id = doctors[0].uniqueIds;
        for (let i = 0; i < id.length; i++) {
          result[i] = await db
            .get()
            .collection(collection.DOCTORS_COLLECTION)
            .findOne({ _id: ObjectId(id[i]) });
          let last = await db
            .get()
            .collection(collection.APPOINTMENT_COLLECTION)
            .find({
              $and: [
                { user: ObjectId(userId) },
                { doctor: id[i] },
                { status: "Consulted" },
              ],
            })
            .sort({ _id: -1 })
            .limit(1)
            .toArray();
          result[i].last = {
            date: last[0].date,
            timeslot: last[0].timeslot,
          };
        }
      }
      resolve(result);
    });
  },
  getConsultedHistory: (userId, doctorId) => {
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
      resolve(history);
    });
  },
  checkUserStatus: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .findOne({
          _id: ObjectId(userId),
        });
      if (user.status === "Active") {
        resolve();
      } else {
        reject();
      }
    });
  },
};
