const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Avaliacao = sequelize.define("Avaliacao", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_avaliacao"
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nota: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  spaceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "id_espaco"
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "id_locatario"
  }
}, {
  tableName: "avaliacao",
  timestamps: false
});

module.exports = Avaliacao;
