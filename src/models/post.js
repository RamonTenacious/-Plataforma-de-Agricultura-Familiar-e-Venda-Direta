const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
    titulo: DataTypes.STRING,
    conteudo: DataTypes.TEXT
});

module.exports = Post;