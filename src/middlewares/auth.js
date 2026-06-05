const jwt = require('jsonwebtoken');

const JWT_SECRET =
    process.env.JWT_SECRET ||
    'desenvolvimento-plataforma-agricultura-2026';

function auth(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res
            .status(401)
            .send('Token não informado');
    }

    const token =
        authHeader.split(' ')[1];

    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.userId = decoded.id;

        next();

    } catch {

        return res
            .status(401)
            .send('Token inválido');
    }
}

module.exports = auth;