require("dotenv").config();
const express = require("express");
const db = require("./db");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
const PORT = 3000;
var path = require("path");
const pinRoutes = require("./routes/pins");
const authRoutes = require("./routes/users");
var cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { isAdmin, isAuth, getAuth } = require("./middleware/auth");
const fileUpload = require("express-fileupload");
const { getValdFromParam } = require("./middleware/vald");

app.use(cookieParser());

function getSafeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/s/:site/users", getValdFromParam, authRoutes);
app.use("/s/:site/pins", getValdFromParam, pinRoutes);

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
    res.clearCookie("token");
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
  if (
    !process.env.INIT_SECRET ||
    req.headers["x-init-secret"] !== process.env.INIT_SECRET
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

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

app.get(
  "/s/:site/edit/:id",
  getValdFromParam,
  isAuth,
  async function (req, res) {
    const pin = await db.pins.findOne({
      where: { id: parseInt(req.params.id), valdId: req.valdId },
    });

    if (!pin) {
      return res.status(404).send("Fangsten finnes ikke");
    }

    const isOwner = pin.userId === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).send("Ingen tilgang");
    }

    res.render("editFish", {
      pin,
      pinJson: getSafeJson(pin),
      coords,
      site: req.params.site,
    });
  },
);

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
app.get("/s/:site/submitFish", getValdFromParam, isAuth, function (req, res, next) {
  res.render("submitFish", {
    title: "Express",
    user: req.user,
    coords,
    site: req.params.site,
  });
});

app.get("/s/:site/addFish", getValdFromParam, isAdmin, function (req, res, next) {
  res.render("addFish", {
    title: "Express",
    user: req.user,
    coords,
    site: req.params.site,
  });
});

app.get("/s/:site/addFishUser", getValdFromParam, isAuth, function (req, res, next) {
  res.render("addFishUser", {
    title: "Express",
    user: req.user,
    site: req.params.site,
  });
});

app.get("/s/:site/pin/:id", getValdFromParam, async function (req, res) {
  try {
    const pin = await db.pins.findOne({
      where: {
        id: parseInt(req.params.id),
        valdId: req.valdId,
        published: true,
      },
    });

    if (!pin) {
      return res.status(404).send("Fangsten finnes ikke");
    }

    res.render("pinDetails", {
      pin,
      pinJson: getSafeJson(pin),
      user: req.user,
      site: req.params.site,
      coords,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Serverfeil");
  }
});

module.exports = app;
