const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function register(req, res) {

    const senhaHash = await bcrypt.hash(
        req.body.senha,
        10
    );

    const user = await User.create({
        nome: req.body.nome,
        email: req.body.email,
        senha: senhaHash
    });

    res.json(user);
}

async function login(req, res) {

    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });

    if (!user)
        return res.status(401).json({
            erro: 'Usuário inválido'
        });

    const valid = await bcrypt.compare(
        req.body.senha,
        user.senha
    );

    if (!valid)
        return res.status(401).json({
            erro: 'Senha inválida'
        });

    const token = jwt.sign(
        { id: user.id },
        'segredo',
        { expiresIn: '1d' }
    );

    res.json({ token });
}

module.exports = {
    register,
    login
};