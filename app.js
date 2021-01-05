var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var hbs = require("express-handlebars");
var subdomain = require("express-subdomain");
var adminRouter = require("./routes/admin");
var userRouter = require("./routes/user");
var doctorRouter = require("./routes/doctor");
var app = express();
var db = require("./config/connection");
var session = require("express-session");
var fileUpload = require("express-fileupload");
var helmet = require("helmet");
var fs = require("fs");
require("dotenv").config();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

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
    helpers: {
      isOAuth: function (auth, email, options) {
        if (auth === "Password" && email) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
      isNotOAuth: function (auth, options) {
        if (auth === "Password") {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
      isImage: function (id, user, options) {
        var path = "./public/images/" + user + "/" + id + ".jpg";
        if (fs.existsSync(path)) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
    },
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
app.use(fileUpload());

db.connect((error) => {
  if (error) throw error;
  console.log("Database Connected");
});

app.use(subdomain("admin.care", adminRouter));
app.use(subdomain("doctor.care", doctorRouter));
app.use("/", userRouter);

// 404 route

app.get("/404", (req, res) => {
  res.status(404).render("404", {
    title: "Page Not Found"
  });
});

// 500 route

app.get("/500", (req, res) => {
  res.status(500).render("500", {
    title: "Internal Server Error"
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).render("404", {
    title: "Page Not Found"
  })
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("500", {
    title: "Internal Server Error"
  });
});

module.exports = app;
