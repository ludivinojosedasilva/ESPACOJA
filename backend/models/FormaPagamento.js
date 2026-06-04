const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FormaPagamento = sequelize.define("FormaPagamento", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_forma"
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: "forma_pagamento",
  timestamps: false
});

module.exports = FormaPagamento;
