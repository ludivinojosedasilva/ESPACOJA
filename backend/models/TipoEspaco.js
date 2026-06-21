const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TipoEspaco = sequelize.define("TipoEspaco", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_tipo"
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  percentualMulta: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 10.00,
    field: "percentual_multa"
  }
}, {
  tableName: "tipo_espaco",
  timestamps: false
});

module.exports = TipoEspaco;