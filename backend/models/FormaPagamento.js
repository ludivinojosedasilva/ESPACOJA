const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FormaPagamento = sequelize.define("FormaPagamento", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  nome: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = FormaPagamento;