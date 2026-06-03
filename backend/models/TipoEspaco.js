const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TipoEspaco = sequelize.define("TipoEspaco", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },

  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = TipoEspaco;