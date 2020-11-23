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
            reject({ msg: "Password is Incorrect" });
          }
        });
      } else {
        reject({ msg: "Email is incorrect" });
      }
    });
  },
};
