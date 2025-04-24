module.exports = (sequelize, DataTypes) => {
  const Pin = sequelize.define("Pin", {
    lat: DataTypes.DOUBLE,
    lng: DataTypes.DOUBLE,
    length: DataTypes.DOUBLE,
    weight: DataTypes.DOUBLE,
  });

  return Pin;
};
