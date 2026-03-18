module.exports = (sequelize, DataTypes) => {
  const vald = sequelize.define("vald", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    river: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  return vald;
};
