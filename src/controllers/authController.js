const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function register(req, res) {

    try {

        const { nome, email, senha } = req.body;

        const senhaHash = await bcrypt.hash(
            senha,
            10
        );

        await User.create({
            nome,
            email,
            senha: senhaHash
        });

        return res.redirect('/');

    } catch (error) {

        console.error(error);

        return res.status(500).send(
            'Erro ao cadastrar usuário'
        );

    }
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