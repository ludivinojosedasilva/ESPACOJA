const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Space = sequelize.define("Space", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_espaco"
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nome"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "descricao"
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "endereco"
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: "valor_hora"
  },
  image: {
  type: DataTypes.STRING,
  allowNull: true,
  field: "imagem"
  },
  comodidades: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "id_proprietario"
  },
  tipoEspacoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "id_tipo"
  }
}, {
  tableName: "espaco",
  timestamps: false
});

module.exports = Space;