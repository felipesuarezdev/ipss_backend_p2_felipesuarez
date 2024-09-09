const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Person = sequelize.define('Person', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nationality: DataTypes.STRING,
    year: {
        type: DataTypes.INTEGER,
        validate: {
            min: 1900,
            max: new Date().getFullYear(),
        },
    },
});

const Work = sequelize.define('Work', {
    company: DataTypes.STRING,
    initContract: DataTypes.DATE,
    finishContract: DataTypes.DATE,
    position: DataTypes.STRING,
});

Person.hasMany(Work);
Work.belongsTo(Person);

module.exports = { Person, Work };
