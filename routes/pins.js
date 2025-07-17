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

  const { success, errors } = pinService.validatePin({
    name,
    weight,
    length,
    bait,
    date,
  });

  if (!success) {
    return res.status(400).json({ success: false, errors });
  }
  const parsedWeight = parseFloat(weight?.replace(",", "."));
  const parsedLength = parseFloat(length?.replace(",", "."));

  try {
    const result = await db.pins.create({
      latitude: lat,
      longitude: lng,
      length: parsedLength,
      weight: parsedWeight,
      bait: bait,
      name: name,
      date: date,
      published: false,
      image: image,
      baitInfo: baitInfo,
      userId: req.user.id,
    });
    res.json({ success: true, pin: result });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get("/", async (req, res) => {
  const result = await db.sequelize.query(
    "select * from pins WHERE published = true;"
  );
  console.log(result);
  res.json(result[0]);
});

router.get("/myPins", isAuth, async (req, res) => {
  try {
    const myPins = await pinService.getUserFish(req.user.id);

    console.log(myPins);
    res.json(myPins);
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
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
  isAuth,
  upload.single("image"),
  async function (req, res) {
    try {
      const user = await db.users.findByPk(req.user.id);
      const isAdmin = user.role === "admin";

      const pin = await db.pins.findByPk(req.params.id);
      if (!pin) {
        return res.status(404).json({ message: "pin not found" });
      }

      const isOwner = pin.userId === req.user.id;
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "unauthorized" });
      }

      const image = req.file?.filename;
      const rawPin = req.body;

      const newPin = {
        name: rawPin.name,
        weight: rawPin.weight?.replace(",", "."),
        length: rawPin.length?.replace(",", "."),
        bait: rawPin.bait,
        date: rawPin.date,
        latitude: rawPin.latitude,
        longitude: rawPin.longitude,
        baitInfo: rawPin.baitInfo,
        published: rawPin.published,
      };

      const response = pinService.validatePin(newPin);
      if (!response.success) {
        console.log(response.errors);
        return res.status(400).json(response.errors);
      }

      await pinService.updatePin({
        ...newPin,
        id: parseInt(req.params.id),
        image: image,
        published: isAdmin ? newPin.published : undefined,
      });

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Update failed:", err.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

module.exports = router;
