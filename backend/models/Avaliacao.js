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
  tipoAvaliacao: {
    type: DataTypes.ENUM("LOCATARIO_AVALIA_ESPACO", "PROPRIETARIO_AVALIA_LOCATARIO"),
    allowNull: false,
    defaultValue: "LOCATARIO_AVALIA_ESPACO",
    field: "tipo_avaliacao"
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
  },
  reservationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "id_reserva"
  }
}, {
  tableName: "avaliacao",
  timestamps: false
});

module.exports = Avaliacao;
