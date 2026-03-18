const db = require("../db");

async function getValdFromParam(req, res, next) {
  try {
    const site = req.params.site;

    const vald = await db.vald.findOne({ where: { site } });
    if (!vald) {
      return res.status(404).json({ error: `${site}' not found` });
    }
    req.vald = vald;
    req.valdId = vald.id;

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { getValdFromParam };
