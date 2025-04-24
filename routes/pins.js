const express = require("express");
const router = express.Router();

router.post("/add-pins", (req, res) => {
  const { lat, lng, length, weight } = req.body;
  console.log({ lat, lng, length, weight });
  res.json({ success: true });
});

module.exports = router;
