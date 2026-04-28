const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Space = sequelize.define("Space", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  location: {
    type: DataTypes.STRING,
    allowNull: false
  },

  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  image: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Space;