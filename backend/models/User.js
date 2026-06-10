const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_usuario"
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nome"
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "senha"
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tipoUsuario: {
    type: DataTypes.ENUM("PROPRIETARIO", "LOCATARIO"),
    allowNull: true,
    field: "tipo_usuario"
  },
  tipoPessoa: {
    type: DataTypes.ENUM("FISICA", "JURIDICA"),
    allowNull: true,
    field: "tipo_pessoa"
  },
  cpf: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cnpj: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "usuario",
  timestamps: false
});

module.exports = User;