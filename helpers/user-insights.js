const db = require("../config/connection");
const collection = require("../config/collection");
const { ObjectId } = require("mongodb");

const myInsights = (userId) => {
  return new Promise(async (resolve, reject) => {
    let lastApp = await db
      .get()
      .collection(collection.APPOINTMENT_COLLECTION)
      .find({
        $and: [{ user: ObjectId(userId) }, { status: "Consulted" }],
      })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    if (lastApp.length !== 0) {
      let doctor = lastApp[0].doctor;
      lastApp[0].doctor = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne({ _id: ObjectId(doctor) });
    }
    let mostVisited = await db
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
          $group: { _id: { doctor: "$doctor" }, count: { $sum: 1 } },
        },
      ])
      .toArray();
    let maxValue = Math.max.apply(
      Math,
      mostVisited.map((item) => item.count)
    );
    if (mostVisited.length !== 0) {
      let mostVisitedDoc = mostVisited.filter(
        (item) => item.count === maxValue
      );
      mostVisited = mostVisitedDoc[0]._id.doctor;
    }
    let lastBook = await db
      .get()
      .collection(collection.APPOINTMENT_COLLECTION)
      .find({
        $and: [{ user: ObjectId(userId) }, { status: { $ne: "Deleted" } }],
      })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    if (lastBook.length !== 0) {
      let doctor1 = lastBook[0].doctor;
      lastBook[0].doctor = await db
        .get()
        .collection(collection.DOCTORS_COLLECTION)
        .findOne({ _id: ObjectId(doctor1) });
    }
    let consultedAppCount = await db
      .get()
      .collection(collection.APPOINTMENT_COLLECTION)
      .countDocuments({
        $and: [{ user: ObjectId(userId) }, { status: "Consulted" }],
      });
    resolve({
      lastApp: lastApp[0],
      mostVisited,
      lastBook: lastBook[0],
      consultedAppCount,
    });
  });
};

module.exports = myInsights;
