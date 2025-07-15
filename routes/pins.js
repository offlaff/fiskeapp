const express = require("express");
const db = require("../db");
const passport = require("passport");
const router = express.Router();
const PinService = require("../services/pinService");
const { isAuth, isAdmin } = require("../middleware/auth");
const pinService = new PinService();
const multer = require("multer");
const path = require("path");

const imgStorage = multer.diskStorage({
  destination: "./public/images",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image), path.extname get the uploaded file extension
  },
});

const upload = multer({
  storage: imgStorage,
});

router.post("/add-pins", isAuth, upload.single("image"), async (req, res) => {
  const image = req.file?.filename;
  const { lat, lng, length, weight, bait, name, date, baitInfo } = req.body;
  console.log({ lat, lng, length, weight });
  const result = await db.pins.create({
    latitude: lat,
    longitude: lng,
    length: length,
    weight: weight,
    bait: bait,
    name: name,
    date: date,
    published: false,
    image: image,
    baitInfo: baitInfo,
    userId: req.user.id,
  });
  res.json({ success: true });
});

router.get("/", async (req, res) => {
  const result = await db.sequelize.query(
    "select * from pins WHERE published = true;"
  );
  console.log(result);
  res.json(result[0]);
});
router.get("/myPins", async (req, res) => {
  const result = await db.sequelize.query(
    "select * from pins WHERE userId = ?;"
  );
  console.log(result);
  res.json(result[0]);
});

router.get("/unpublished", async (req, res) => {
  const result = await db.sequelize.query(
    "select * from pins WHERE published = false;"
  );
  console.log(result);
  res.json(result[0]);
});

router.post("/search", async function (req, res) {
  const { search } = req.body;
  try {
    const results = await pinService.searchName(search, req.body.year);

    res.status(200).json({ results: results, totalResults: results.length });
  } catch {
    console.log("Søk feila");
    res.status(500).json({ message: "søk feilet" });
  }
});

router.patch(
  "/edit/:id",
  isAdmin,
  upload.single("image"),
  async function (req, res) {
    const image = req.file?.filename;

    const pin = req.body;
    const response = pinService.validatePin(pin);
    if (!response.success) {
      return res.status(400).json(response.errors);
    }
    try {
      await pinService.updatePin({
        ...pin,
        id: parseInt(req.params.id),
        image: image,
      });
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ success: false });
    }
  }
);

module.exports = router;
