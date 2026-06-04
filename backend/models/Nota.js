const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Nota = sequelize.define("Nota", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_nota"
  },
  dataNota: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "data_nota"
  },
  valorNota: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: "valor_nota"
  },
  reservationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: "id_reserva"
  }
}, {
  tableName: "nota",
  timestamps: false
});

module.exports = Nota;
