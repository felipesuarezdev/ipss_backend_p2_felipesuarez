const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres://fsuarez:123456@localhost:5432/data_personas', {
  dialect: 'postgres',
});

module.exports = sequelize;
