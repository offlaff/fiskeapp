var express = require("express");
const db = require("../db");
const { QueryTypes } = require("sequelize");

class PinService {
  constructor() {}

  async searchName(search, years) {
    if (years.length === 0) {
      return await db.sequelize.query(
        `Select pins.id, pins.baitInfo, pins.image, pins.name, pins.latitude, pins.longitude,
      pins.length, pins.weight, pins.bait, pins.date
      from pins where pins.name like :search and pins.published = true; `,
        {
          replacements: { search: `%${search}%` },
          type: QueryTypes.SELECT,
        }
      );
    } else {
      return await db.sequelize.query(
        `Select pins.id, pins.baitInfo, pins.image, pins.name, pins.latitude, pins.longitude,
              pins.length, pins.weight, pins.bait, pins.date
              from pins where pins.name like :search and SUBSTRING(pins.date, 1, 4) in(:year)
              and pins.published = true `,
        {
          replacements: {
            search: `%${search}%`,
            year: years.map((year) => {
              return year.toString();
            }),
          },
          type: QueryTypes.SELECT,
        }
      );
    }
  }
  validatePin(pin) {
    return { success: true, errors: [] };
    //implement
  }
  async updatePin(pin) {
    const pinFromDb = await db.pins.findByPk(pin.id);
    pinFromDb.name = pin.name || pinFromDb.name;
    pinFromDb.weight = pin.weight || pinFromDb.weight;
    pinFromDb.length = pin.length || pinFromDb.length;
    pinFromDb.bait = pin.bait || pinFromDb.bait;
    pinFromDb.date = pin.date || pinFromDb.date;
    pinFromDb.published = pin.published || pinFromDb.published;
    pinFromDb.latitude = pin.latitude || pinFromDb.latitude;
    pinFromDb.image = pin.image || pinFromDb.image;
    pinFromDb.baitInfo = pin.baitInfo || pinFromDb.baitInfo;

    pinFromDb.longitude = pin.longitude || pinFromDb.longitude;
    await pinFromDb.save();
    return pinFromDb;
  }

  async getUserFish(userId) {
    return await db.pins.findAll({
      where: { userId: userId, published: 0 },
      include: [
        {
          model: db.users,
          as: "user",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
}

module.exports = PinService;
