const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reservation = sequelize.define("Reservation", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_reserva"
  },
  startDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "data_hora_inicio"
  },
  endDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "data_hora_fim"
  },
  status: {
    type: DataTypes.ENUM("PENDENTE", "CONFIRMADA", "CANCELADA", "FINALIZADA"),
    defaultValue: "PENDENTE"
  },
  valorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: "valor_total"
  },
  valorDesconto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: "valor_desconto"
  },
  valorMulta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: "valor_multa"
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
  tableName: "reserva",
  timestamps: false
});

module.exports = Reservation;
