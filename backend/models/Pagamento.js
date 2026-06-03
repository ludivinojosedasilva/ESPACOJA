const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pagamento = sequelize.define("Pagamento", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  valor: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  status: {
    type: DataTypes.STRING,
    allowNull: false
  },

  dataPagamento: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

module.exports = Pagamento;