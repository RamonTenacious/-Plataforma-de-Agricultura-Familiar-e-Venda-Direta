require('dotenv').config();

const app = require('./src/app');
const sequelize = require('./src/config/database');
require('./src/models');

const PORT = 3000;

async function start() {
    try {

        await sequelize.authenticate();

        await sequelize.authenticate();

        console.log(
            '✅ Banco conectado com sucesso.'
        );

        await sequelize.sync();

        console.log(
            '✅ Tabelas sincronizadas.'
        );
        
        app.listen(PORT, () => {
            console.log(
                `✅ Servidor rodando na porta ${PORT}`
            );
        });

    } catch (err) {

        console.error(
            '❌ Erro ao conectar:',
            err.message
        );

    }
}

start();