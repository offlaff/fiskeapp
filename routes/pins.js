const express = require("express");
const db = require("../db");

const passport = require("passport");
const router = express.Router();
const PinService = require("../services/pinService");
const { isAuth, isAdmin } = require("../middleware/auth");
const pinService = new PinService();
const multer = require("multer");
const path = require("path");

const { uploadImage } = require("../cloudinary");
const { getValdFromParam } = require("../middleware/vald");

const imgStorage = multer.diskStorage({
  destination: "./public/images",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: imgStorage });

router.post("/add-pins", isAuth, upload.single("image"), async (req, res) => {
  let image;
  const { lat, lng, length, weight, bait, name, date, baitInfo, speciesId } =
    req.body;

  const { success, errors } = pinService.validatePin({
    name,
    weight,
    length,
    bait,
    date,
    speciesId,
  });

  if (!success) {
    return res.status(400).json({ success: false, errors });
  }

  if (req.file) {
    const uploadedimage = await uploadImage(req.file.filename);
    console.log("got image:", uploadedimage);
    if (uploadedimage.url) {
      image = uploadedimage.url;
    }
  }

  const parsedWeight = parseFloat(weight?.replace(",", "."));
  const parsedLength = parseFloat(length?.replace(",", "."));

  try {
    const result = await db.pins.create({
      latitude: lat,
      longitude: lng,
      length: parsedLength,
      weight: parsedWeight,
      bait,
      name,
      date,
      published: false,
      image,
      baitInfo,
      userId: req.user.id,
      valdId: req.valdId,
      speciesId: speciesId,
    });

    res.json({ success: true, pin: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

router.get("/", async (req, res) => {
  const result = await db.sequelize.query(
    "SELECT * from pins WHERE published = true AND valdId = :valdId;",
    { replacements: { valdId: req.vald.id } },
  );
  console.log(result);
  res.json(result[0]);
});

router.delete("/:id", async function (req, res, next) {
  const result = await pinService.deletePin(req.params.id);
  if (result.error) return res.status(404).json(result);

  res.json({ message: "pin deleted" });
});

router.get("/myPins", isAuth, async (req, res) => {
  try {
    const myPins = await pinService.getUserFish(req.user.id, req.valdId);

    console.log(myPins);
    res.json(myPins);
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

router.get("/unpublished", async (req, res) => {
  const result = await db.sequelize.query(
    "select * from pins WHERE published = false AND valdId = :valdId;",
    { replacements: { valdId: req.valdId } },
  );
  console.log(result);
  res.json(result[0]);
});

router.post("/search", async function (req, res) {
  const { search } = req.body;
  try {
    const results = await pinService.searchName(
      search,
      req.body.year,
      req.valdId,
    );

    res.status(200).json({ results: results, totalResults: results.length });
  } catch {
    console.log("Søk feila", error);
    res.status(500).json({ message: "søk feilet" });
  }
});
router.patch(
  "/edit/:id",
  isAuth,
  upload.single("image"),
  async function (req, res) {
    try {
      let image;
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

      if (req.file) {
        const uploadedimage = await uploadImage(req.file.filename);
        console.log("got image:", uploadedimage);
        if (uploadedimage.url) {
          image = uploadedimage.url;
        }
      }
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
        valdId: req.valdId,
        speciesId: rawPin.speciesId,
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
  },
);

module.exports = router;
