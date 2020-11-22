const mongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const state = {
  db: null,
};
module.exports.connect = (done) => {
  const url = process.env.DB_URL;
  const dbname = process.env.DB_NAME;

  mongoClient.connect(url, { useUnifiedTopology: true }, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
    done();
  });
};

module.exports.get = () => {
  return state.db;
};
