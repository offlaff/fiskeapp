var express = require("express");
var router = express.Router();
require("dotenv").config();
const db = require("../db");
const AuthService = require("../services/authService");
const authService = new AuthService();
const { isAuth } = require("../middleware/auth");
const passport = require("passport");

router.post("/register", async function (req, res) {
  const response = authService.validateRegistration(req.body);
  if (!response.success) {
    return res.status(400).json({ error: response.errors });
  }
  try {
    const token = await authService.registerUser({
      ...req.body,
      role: "user",
    });
    return res.status(201).json({
      message: "User registered successfully",
      token,
    });
  } catch (err) {
    console.log(err);
    if (err.message === "Validation error") {
      return res.status(400).json({ error: err.message });
    }
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await authService.loginUser({ username, password });
    if (response.error) {
      return res.status(500).json({ error: response.error });
    } else {
      return res.status(200).json({
        message: "Login successful",
        token: response,
      });
    }
  } catch (err) {
    console.error("Error logging in:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", isAuth, async (req, res) => {
  const user = await db.users.findByPk(req.user.id);
  return res.status(200).json({
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
});

module.exports = router;
