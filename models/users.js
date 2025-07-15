const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const users = sequelize.define(
    "users",
    {
      fullName: DataTypes.STRING,
      username: {
        type: DataTypes.STRING,
        unique: true,
      },

      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: DataTypes.STRING,
      phone: DataTypes.STRING,
      role: DataTypes.ENUM("admin", "user"),
    },
    { timestamps: true }
  );
  users.associate = function (models) {
    users.hasMany(models.pins, {
      foreignKey: "userId",
    });
  };
  return users;
};
