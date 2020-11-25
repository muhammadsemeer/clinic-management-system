const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");

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
            reject({ msg: "Invalid Password" });
          }
        });
      } else {
        reject({ msg: "Invalid Email" });
      }
    });
  },
  addDoctor: (details) => {
    return new Promise(async (resolve, reject) => {
      details.status = "Active";
      details.password = await bcrypt.hash(details.password, 10);
      db.get()
        .collection(collection.DOCTORS_COLLECTION)
        .insertOne(details)
        .then((data) => {
          resolve();
        });
    });
  },
};
