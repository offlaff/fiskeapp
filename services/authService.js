var express = require("express");
const db = require("../db");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

class AuthService {
  constructor() {}

  async validateRegistration(user) {
    const errors = [];
    if (!user.fullName || user.fullName.length < 2) {
      errors.push("Navn må være lenger enn to karakterer");
    }
    if (!user.username || user.username.length < 3) {
      errors.push("Brukernavn må være lenger enn 3 karakterer");
    }
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
    if (!user.email || !emailRegex.test(user.email)) {
      errors.push("E-posten er ikke gyldig");
    }
    const existingEmail = await db.users.findOne({
      where: { email: user.email },
    });

    if (existingEmail) {
      errors.push("E-post er allerede i bruk");
    }
    if (!user.password || user.password.length < 8) {
      errors.push("Passordet må være 8 eller mer karakterer");
    }

    return { success: errors.length === 0, errors };
  }
  createToken(user) {
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return token;
  }
  async registerUser(user) {
    const { password, fullName, username, phone, role, email, valdId } = user;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.users.create({
      username: username,
      password: hashedPassword,
      fullName: fullName,
      phone: phone,
      role: role,
      email: email,
      valdId: valdId,
    });
    const token = this.createToken(newUser);

    return token;
  }

  async loginUser(options) {
    const { username, password } = options;
    try {
      const user = await db.users.findOne({
        where: { [Op.or]: [{ username: username }, { email: username }] },
      });

      if (!user) {
        return { error: "Feil e-post eller passord" };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { error: "Feil e-post eller passord" };
      }

      const token = this.createToken(user);

      return token;
    } catch (err) {
      console.error("Error logging in:", err.message);
      return { error: "Server error" };
    }
  }
}

module.exports = AuthService;
