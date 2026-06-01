const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'faculdade',
    'root',
    'senha',
    {
        host: 'localhost',
        dialect: 'mysql'
    }
);

module.exports = sequelize;