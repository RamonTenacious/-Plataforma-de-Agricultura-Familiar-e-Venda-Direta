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

    try {

        const { email, senha } = req.body;

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res
                .status(401)
                .send('Usuário não encontrado');
        }

        const senhaValida =
            await bcrypt.compare(
                senha,
                user.senha
            );

        if (!senhaValida) {

            return res
                .status(401)
                .send('Senha incorreta');
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        return res.json({
            token
        });

    } catch (error) {

        console.error(error);

        return res
            .status(500)
            .send('Erro ao realizar login');
    }
}

module.exports = {
    register,
    login
};