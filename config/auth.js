const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("../db");
const { QueryTypes } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(async function (username, password, done) {
      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        console.log(db);
        const user = (
          await db.sequelize.query(`SELECT * FROM users WHERE username=?;`, {
            replacements: [username],
            type: QueryTypes.SELECT,
          })
        )[0];
        console.log("tissefant");
        console.log(user);
        if (!user) {
          return done(null, false, {
            message: "Incorrect username or password.",
          });
        }
        if (user.password !== hashedPassword) {
          return done(null, false, {
            message: "Incorrect username or password.",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
      cb(null, user);
    });
  });

  passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });
};
