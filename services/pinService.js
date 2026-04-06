var express = require("express");
const db = require("../db");
const { QueryTypes } = require("sequelize");

//add vald i queries

class PinService {
  constructor() {}

  async searchName(search, years, valdId) {
    if (!years || years.length === 0) {
      return await db.sequelize.query(
        `SELECT pins.id, pins.baitInfo, pins.image, pins.name, pins.latitude, pins.longitude,
      pins.length, pins.weight, pins.bait, pins.date, pins.speciesId,
      species.name AS speciesName
      FROM pins
      LEFT JOIN species ON pins.speciesId = species.id
      WHERE pins.name LIKE :search
      AND pins.published = true
      AND pins.valdId = :valdId;`,
        {
          replacements: {
            search: `%${search}%`,
            valdId,
          },
          type: QueryTypes.SELECT,
        },
      );
    } else {
      return await db.sequelize.query(
        `SELECT pins.id, pins.baitInfo, pins.image, pins.name,
      pins.latitude, pins.longitude, pins.length, pins.weight,
      pins.bait, pins.date, pins.speciesId,
      species.name AS speciesName
      FROM pins
      LEFT JOIN species ON pins.speciesId = species.id
      WHERE pins.name LIKE :search
      AND SUBSTRING(pins.date, 1, 4) IN (:year)
      AND pins.published = true
      AND pins.valdId = :valdId;`,
        {
          replacements: {
            search: `%${search}%`,
            year: years.map((year) => year.toString()),
            valdId,
          },
          type: QueryTypes.SELECT,
        },
      );
    }
  }
  validatePin(options) {
    const { name, weight, length, bait, date, speciesId } = options;
    const errorArray = [];
    if (!name || typeof name !== "string") {
      errorArray.push({
        msg: "Må inkludere navn",
      });
    }
    const parsedWeight = parseFloat(weight?.replace(",", "."));
    if (!weight || isNaN(parsedWeight)) {
      errorArray.push({ msg: "Vekt på fisk må være et gyldig tall, Eks: 5,8" });
    }
    const parsedLength = parseFloat(length?.replace(",", "."));
    if (!length || isNaN(parsedLength)) {
      errorArray.push({ msg: "Lengde på fisk skal kun være tall, Eks: 103" });
    }
    if (!bait) {
      errorArray.push({
        msg: "Agn må inkluderes",
      });
    }
    if (!date || isNaN(Date.parse(date))) {
      errorArray.push({
        msg: `Gyldig dato må inkluderes, format: YYYY-MM-DD. Mottatt: ${date}`,
      });
    }
    if (!speciesId) {
      errorArray.push({ msg: "Fiskeslag må inkluderes" });
    }
    if (!bait) {
      errorArray.push({
        msg: "Agn må inkluderes",
      });
    }
    if (Number.isNaN(Number(weight))) {
      errorArray.push({
        msg: "Vekt må kun være tall, Eks: 13,4",
      });
      if (Number.isNaN(Number(length))) {
        errorArray.push({
          msg: "Lengde må kun være tall, Eks: 104",
        });
      }
    }
    return {
      success: errorArray.length === 0,
      errors: errorArray,
    };
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
    pinFromDb.speciesId = pin.speciesId || pinFromDb.speciesId;
    pinFromDb.baitInfo = pin.baitInfo || pinFromDb.baitInfo;

    pinFromDb.longitude = pin.longitude || pinFromDb.longitude;
    await pinFromDb.save();
    return pinFromDb;
  }

  async getUserFish(userId, valdId) {
    return await db.pins.findAll({
      where: { userId: userId, published: 0, valdId },
      include: [
        {
          model: db.users,
          as: "user",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
  async deletePin(id) {
    if (!id) {
      return { error: "id is required" };
    }
    const pin = await db.pins.findByPk(id);
    if (!pin) return { error: "Not found" };
    await pin.destroy();
    return { message: "Destroyed" };
  }
}

module.exports = PinService;
