var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var hbs = require("express-handlebars");
var subdomain = require("express-subdomain");
var adminRouter = require("./routes/admin");
var app = express();
var db = require("./config/connection");
var session = require("express-session");
require("dotenv").config();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 24 * 100 },
  })
);

db.connect((error) => {
  if (error) throw error;
  console.log("Database Connected");
});

app.use(subdomain("admin", adminRouter));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
