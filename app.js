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
const authRoutes = require("./routes/users");
var cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { isAdmin, getAuth } = require("./middleware/auth");
const fileUpload = require("express-fileupload");
const { getValdFromParam } = require("./middleware/vald");

app.use(
  session({
    secret: "kuknisse",
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore(),
  }),
);
(async () => {
  const { createUploadthing, createRouteHandler } =
    await import("uploadthing/express");
  const f = createUploadthing();
  const uploadRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    imageUploader: f({
      image: {
        /**
         * For full list of options and defaults, see the File Route API reference
         * @see https://docs.uploadthing.com/file-routes#route-config
         */
        maxFileSize: "4MB",
        maxFileCount: 1,
      },
    }).onUploadComplete((data) => {
      console.log("upload completed", data);
    }),
  };
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router: uploadRouter,
      config: {},
    }),
  );
})();

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/s/:site/users", getValdFromParam, authRoutes);
app.use("/s/:site/pins", getValdFromParam, pinRoutes);

app.use(cookieParser());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  }),
);

const coords = {
  center: [process.env.CENTER_LAT, process.env.CENTER_LNG],
  northeast: [process.env.NORTHEAST_LAT, process.env.NORTHEAST_LNG],
  southwest: [process.env.SOUTHWEST_LAT, process.env.SOUTHWEST_LNG],
};

// temporary fix, add index site later
// app.get("/", getAuth, function (req, res, next) {
//   res.render("index", {
//     title: "Express",
//     user: req.user,
//     coords,
//     site: req.params.site,
//   });
// });

app.get("/", (req, res) => {
  res.redirect("/s/kvaestad");
});

app.get("/s/:site", getValdFromParam, function (req, res, next) {
  res.render("index", {
    title: "Express",
    user: req.user,
    coords,
    site: req.params.site,
  });
});

app.get(
  "/s/:site/logout",
  getAuth,
  getValdFromParam,
  function (req, res, next) {
    res.render("logout", { title: "Express", user: req.user });
  },
);
db.sequelize
  .sync({ alter: true })
  .then(() => {})
  .catch((err) => {
    console.error("Sync error:", err);
  });

app.post("/init", async function (req, res) {
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  const adminUser = {
    username: "admin",
    fullName: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: hashedPassword,
    role: "admin",
    valdId: 1,
  };
  await db.users.create(adminUser, { ignoreDuplicates: true });
  res.status(200).json({ success: true });
});

app.get("/s/:site/edit/:id", async function (req, res) {
  const pin = await db.pins.findByPk(parseInt(req.params.id));
  res.render("editFish", { pin, coords, site: req.params.site });
});

app.get("/s/:site/login", getValdFromParam, function (req, res, next) {
  res.render("login", {
    title: "Express",
    user: req.user,
    site: req.params.site,
  });
});
app.get("/s/:site/register", getValdFromParam, function (req, res, next) {
  res.render("register", {
    title: "Express",
    user: req.user,
    site: req.params.site,
  });
});
app.get("/s/:site/submitFish", getValdFromParam, function (req, res, next) {
  res.render("submitFish", {
    title: "Express",
    user: req.user,
    coords,
    site: req.params.site,
  });
});

app.get("/s/:site/addFish", getValdFromParam, function (req, res, next) {
  res.render("addFish", {
    title: "Express",
    user: req.user,
    coords,
    site: req.params.site,
  });
});

app.get("/s/:site/addFishUser", getValdFromParam, function (req, res, next) {
  res.render("addFishUser", {
    title: "Express",
    user: req.user,
    site: req.params.site,
  });
});

module.exports = app;
