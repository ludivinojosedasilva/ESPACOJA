const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ImagemEspaco = sequelize.define("ImagemEspaco", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "id_imagem"
  },
  urlImagem: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: "url_imagem"
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  spaceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "id_espaco"
  }
}, {
  tableName: "imagem_espaco",
  timestamps: false
});

module.exports = ImagemEspaco;
