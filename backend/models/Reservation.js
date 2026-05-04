const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reservation = sequelize.define("Reservation", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },

  startDateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },

  endDateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },

  spaceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // 🔥 IMPORTANTE (SEGURANÇA)
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Reservation;