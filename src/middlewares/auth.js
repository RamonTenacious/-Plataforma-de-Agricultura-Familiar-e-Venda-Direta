const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader)
        return res.sendStatus(401);

    const token = authHeader.split(' ')[1];

    try {

        const decoded = jwt.verify(
            token,
            'segredo'
        );

        req.userId = decoded.id;

        next();

    } catch {

        return res.sendStatus(401);
    }
};