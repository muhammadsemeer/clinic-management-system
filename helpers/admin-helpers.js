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
      details.blockedUsers = [];
      let emailFound = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({
          $and: [
            { email: details.email },
            { $or: [{ status: "Active" }, { status: "Blocked" }] },
          ],
        })
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
        .find({ status: "Active" })
        .toArray();
      resolve(doctors);
    });
  },
  checkUsername: (username) => {
    return new Promise(async (resolve, reject) => {
      let userNameDb = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({
          $and: [
            { username: username },
            { $or: [{ status: "Active" }, { status: "Blocked" }] },
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
      let mailFound;
      if (details.email) {
        mailFound = await db
          .get()
          .collection(collection.PATIENT_COLLECTION)
          .find({
            $and: [
              {
                email: details.email,
              },
              { $or: [{ status: "Active" }, { status: "Blocked" }] },
            ],
          })
          .toArray();
        details.password = await bcrypt.hash(details.password, 10);
      } else {
        mailFound = await db
          .get()
          .collection(collection.PATIENT_COLLECTION)
          .find({
            $and: [
              {
                contactno: details.contactno,
              },
              { $or: [{ status: "Active" }, { status: "Blocked" }] },
            ],
          })
          .toArray();
      }
      if (mailFound.length <= 0) {
        details.status = "Active";
        details.auth = "Password";
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
  getPatients: () => {
    return new Promise(async (resolve, reject) => {
      let pateints = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({ status: "Active" })
        .toArray();
      resolve(pateints);
    });
  },
  deletePateint: (pateintId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.PATIENT_COLLECTION)
        .updateOne(
          { _id: ObjectId(pateintId) },
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
  getOnePatient: (pateintId) => {
    return new Promise(async (resolve, reject) => {
      let patient = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .findOne({ _id: ObjectId(pateintId) });
      resolve(patient);
    });
  },
  updatePatient: (pateintId, details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PATIENT_COLLECTION)
        .updateOne(
          { _id: ObjectId(pateintId) },
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
    });
  },
  getCounts: () => {
    return new Promise(async (resolve, reject) => {
      let doctorsCount = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .countDocuments({ status: "Active" });
      let patientsCount = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .countDocuments({ status: "Active" });
      let appointmentsCount = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .countDocuments();
      resolve({ doctorsCount, patientsCount, appointmentsCount });
    });
  },
  blockDoctor: (doctorId, status) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .updateOne(
          { _id: ObjectId(doctorId) },
          {
            $set: {
              status: status,
            },
          }
        )
        .then((res) => {
          resolve(true);
        });
    });
  },
  blockPatient: (userId, status) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PATIENT_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              status: status,
            },
          }
        )
        .then((res) => {
          resolve(true);
        });
    });
  },
  getBlockedDoctors: () => {
    return new Promise(async (resolve, reject) => {
      let doctors = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .find({ status: "Blocked" })
        .toArray();
      resolve(doctors);
    });
  },
  getBlockedPatients: () => {
    return new Promise(async (resolve, reject) => {
      let doctors = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({ status: "Blocked" })
        .toArray();
      resolve(doctors);
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
              $and: [
                {
                  doctor: ObjectId(doctorId),
                },
                {
                  status: "Deleted",
                },
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
  getConsultedAppointments: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                {
                  doctor: ObjectId(doctorId),
                },
                {
                  status: "Consulted",
                },
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
  getPendingAppointments: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                {
                  doctor: ObjectId(doctorId),
                },
                {
                  status: "Pending",
                },
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
      let result = [];
      appointment.forEach((element) => {
        var today = new Date();
        today = new Date(today).setHours(0,0,0,0);
        var dbDate = new Date(element.date);
        if (dbDate >= today) {
          result.push(element);
        }
      });
      resolve(result);
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
                {
                  doctor: ObjectId(doctorId),
                },
                {
                  status: "Deleted",
                },
                {
                  date: date,
                },
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
  getConsultedAppointmentsByDate: (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                {
                  doctor: ObjectId(doctorId),
                },
                {
                  status: "Consulted",
                },
                {
                  date: date,
                },
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
  getPendingAppointmentsByDate: (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
      let appointment = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                {
                  doctor: ObjectId(doctorId),
                },
                {
                  status: "Pending",
                },
                {
                  date: date,
                },
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
  getCountsOfAppontments: (doctorId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .countDocuments({ doctor: ObjectId(doctorId) });
      let approved = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .countDocuments({
          $and: [{ doctor: ObjectId(doctorId) }, { status: "Approved" }],
        });
      let pending = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .countDocuments({
          $and: [{ doctor: ObjectId(doctorId) }, { status: "Pending" }],
        });
      let consulted = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .countDocuments({
          $and: [{ doctor: ObjectId(doctorId) }, { status: "Consulted" }],
        });
      let deleted = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .countDocuments({
          $and: [{ doctor: ObjectId(doctorId) }, { status: "Deleted" }],
        });
      resolve({ total, approved, pending, consulted, deleted });
    });
  },
  getMyProfile: (email) => {
    return new Promise(async (resolve, reject) => {
      let profile = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .find({ email: email })
        .toArray();
      if (profile.length > 0) {
        resolve(profile[0]);
      } else {
        reject({ msg: "Wrong Email Id" });
      }
    });
  },
  editProfile: (id, details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ADMIN_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              name: details.name,
              email: details.email,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  changePassword: (details) => {
    return new Promise(async (resolve, reject) => {
      details.password = await bcrypt.hash(details.password, 10);
      db.get()
        .collection(collection.ADMIN_COLLECTION)
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
  getMyPatients: (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
      let patients = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [{ doctor: ObjectId(doctorId) }, { date: date }],
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
      if (patients.length != 0) {
        var id = patients[0].uniqueIds;
        var result = [];
        for (let i = 0; i < id.length; i++) {
          result[i] = await db
            .get()
            .collection(collection.PATIENT_COLLECTION)
            .findOne({ _id: ObjectId(id[i]) });
        }
        resolve(result);
      } else {
        resolve([]);
      }
    });
  },
  getDoctorStats: (doctorId, date, patients) => {
    return new Promise(async (resolve, reject) => {
      let totalAppointments = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .countDocuments({ doctor: ObjectId(doctorId) });
      let requestedAppointments = await db
        .get()
        .collection(collection.APPOINTMENT_COLLECTION)
        .countDocuments({ doctor: ObjectId(doctorId), date: date });
      let aPercentage = (requestedAppointments / totalAppointments) * 100;
      let pPercentage = (patients.length / totalAppointments) * 100;
      let result = [
        {
          label: "Appointments",
          value: Math.floor(aPercentage),
        },
        {
          label: "Patient",
          value: Math.floor(pPercentage),
        },
      ];
      if (aPercentage === 0 && pPercentage === 0) {
        return resolve([]);
      }
      resolve(result);
    });
  },
};
