module.exports = (sequelize, DataTypes) => {
  const pins = sequelize.define("pins", {
    latitude: DataTypes.DOUBLE,
    longitude: DataTypes.DOUBLE,
    length: DataTypes.DOUBLE,
    weight: DataTypes.DOUBLE,
    bait: DataTypes.ENUM("wobbler", "sluk", "flue"),
    name: DataTypes.STRING,
    date: DataTypes.DATEONLY,
    published: DataTypes.BOOLEAN,
    baitInfo: DataTypes.STRING,
    image: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  pins.associate = function (models) {
    pins.belongsTo(models.users, {
      foreignKey: "userId",
    });
    pins.belongsTo(models.vald, { foreignKey: "valdId" });
  };

  return pins;
};
