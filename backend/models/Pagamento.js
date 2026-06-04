const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pagamento = sequelize.define("Pagamento", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_pagamento"
  },
  dataPagamento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: "data_pagamento"
  },
  valorPagamento: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: "valor_pagamento"
  },
  status: {
    type: DataTypes.ENUM("PENDENTE", "APROVADO", "RECUSADO", "ESTORNADO"),
    defaultValue: "PENDENTE"
  },
  notaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "id_nota"
  },
  formaPagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "id_forma"
  }
}, {
  tableName: "pagamento",
  timestamps: false
});

module.exports = Pagamento;
