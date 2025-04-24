require("dotenv").config();
const express = require("express");
const db = require("./db");
const mysql = require("mysql2");
const cors = require("cors");
const passport = require("passport");
const app = express();
const PORT = 3000;
var path = require("path");
require("./config/auth")(passport);
const session = require("express-session");
const flash = require("express-flash");
const SQLiteStore = require("connect-sqlite3")(session);
const pinRoutes = require("./routes/pins");
var cookieParser = require("cookie-parser");

app.use(
  session({
    secret: "kuknisse",
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore(),
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));

app.use(pinRoutes);

app.use(cookieParser());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", function (req, res, next) {
  res.render("index", { title: "Express", user: req.user });
});

// må være logget inn
app.get("/add-pins", isLoggedIn, function (req, res, next) {
  res.render("index", { title: "Express", user: req.user });
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/add-pins",
    failureRedirect: "/login?error",
    failureFlash: true,
  })
);

// app.post("/add-pins", isLoggedIn, (req, res) => {
//   const { lat, lng, length, weight } = req.body;
//   console.log(lat, lng, length, weight);
//   const query =
//     "INSERT INTO pins (latitude, longitude, length, weight) VALUES (?, ?, ?, ?)";
//   db.query(query, [lat, lng, length, weight], (err, result) => {
//     if (err) {
//       console.error("Error inserting pin:", err);
//       return res.status(500).send("Error saving pin");
//     }
//     res.send({ success: true, id: result.insertId });
//   });
// });
// gjer om te sequelize og fiks bug
app.get("/api/pins", (req, res) => {
  db.query("SELECT * FROM pins", (err, results) => {
    if (err) {
      console.error("Error fetching pins:", err);
      return res.status(500).send("Error loading pins");
    }
    res.json(results);
  });
});

app.get("/login", function (req, res, next) {
  res.render("login", { title: "Express", user: req.user });
});
//1. request for å adde pin i databasen
// login endepunkt
//

function isLoggedIn(req, res, next) {
  if (req.user) {
    return next();
  }
  console.log(req.user);
  res.redirect("/login");
}

module.exports = app;
