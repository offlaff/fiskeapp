const express = require("express");
const db = require("../db");
const router = express.Router();

router.post("/add-pins", async (req, res) => {
  const { lat, lng, length, weight } = req.body;
  console.log({ lat, lng, length, weight });
  const result = await db.pins.create({
    latitude: lat,
    longitude: lng,
    length: length,
    weight: weight,
  });
  res.json({ success: true });
});

router.get("/pins", async (req, res) => {
  const result = await db.sequelize.query("select * from pins");
  console.log(result);
  res.json(result[0]);
});

module.exports = router;
