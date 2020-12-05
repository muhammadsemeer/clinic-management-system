const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");

module.exports = {
  doSignup: (details) => {
    return new Promise(async (resolve, reject) => {
      console.log(details);
      let mailFound = await db
        .get()
        .collection(collection.PATIENT_COLLECTION)
        .find({
          $or: [{ email: details.email }, { contactno: details.contactno }],
        })
        .toArray();
      if (mailFound.length <= 0) {
        details.password = await bcrypt.hash(details.password, 10);
        db.get()
          .collection(collection.PATIENT_COLLECTION)
          .insertOne(details)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else if (mailFound[0].status === "Deleted") {
        details.password = await bcrypt.hash(details.password, 10);
        db.get()
          .collection(collection.PATIENT_COLLECTION)
          .updateOne(
            { email: details.email },
            {
              $set: {
                name: details.name,
                email: details.email,
                password: details.password,
                gender: details.gender,
                status: "Active",
              },
            }
          )
          .then((data) => {
            resolve();
          });
      } else {
        reject({ msg: "Email Id or Contact No Already Exists" });
      }
    });
  },
};
