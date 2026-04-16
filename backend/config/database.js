const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("espacoja", "root", "Ludivino2004", {
  host: "localhost",
  dialect: "mysql"
});

module.exports = sequelize;