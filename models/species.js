module.exports = (sequelize, DataTypes) => {
  const species = sequelize.define("species", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  species.associate = function (models) {
    species.hasMany(models.pins, {
      foreignKey: "speciesId",
      as: "pins",
    });
  };

  return species;
};
