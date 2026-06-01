const User = require('./User');
const Post = require('./Post');
const Produto = require('./produto');

User.hasMany(Post);
Post.belongsTo(User);

module.exports = {
    User,
    Post,
    Produto
};