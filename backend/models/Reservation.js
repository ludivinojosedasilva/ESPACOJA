const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reservation = sequelize.define("Reservation", {
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
  }
});

module.exports = Reservation;