const jwt = require("jsonwebtoken");
const db = require("../db");

function getToken(req) {
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader && authHeader.split(" ")[1];

  if (headerToken && headerToken !== "null" && headerToken !== "undefined") {
    return headerToken;
  }

  return req.cookies?.token;
}

async function isAuth(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const userFromJWT = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.users.findByPk(parseInt(userFromJWT.id));

    if (!user) {
      return res.status(403).json({ message: "Invalid token" });
    }

    if (req.valdId && Number(user.valdId) !== Number(req.valdId)) {
      return res.status(403).json({ message: "Wrong fishing area" });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

function getAuth(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    req.user = null;
  }
  return next();
}

async function isAdmin(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const userFromJWT = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.users.findByPk(parseInt(userFromJWT.id));

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (req.valdId && Number(user.valdId) !== Number(req.valdId)) {
      return res.status(403).json({ message: "Wrong fishing area" });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

module.exports = { isAdmin, isAuth, getAuth };
