module.exports = (sequelize, DataTypes) => {
  const pins = sequelize.define(
    "pins",
    {
      latitude: DataTypes.DOUBLE,
      longitude: DataTypes.DOUBLE,
      length: DataTypes.DOUBLE,
      weight: DataTypes.DOUBLE,
    },
    {
      timestamps: false,
    }
  );

  return pins;
};
