const db = require("../config/connection");
const collection = require("../config/collection");
const { ObjectId } = require("mongodb");

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
      console.log(appointment);
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
        .toArray()
      console.log(appointment);
      resolve(appointment);
    });
  },
};
