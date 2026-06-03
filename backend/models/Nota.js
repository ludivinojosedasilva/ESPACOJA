const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Nota = sequelize.define("Nota", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  nota: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  comentario: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Nota;