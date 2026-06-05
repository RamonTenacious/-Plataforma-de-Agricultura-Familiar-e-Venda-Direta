const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');

const produtoController = require('../controllers/produtoController');

const auth = require('../middlewares/auth');

router.get('/', (req, res) => {
    res.render('auth/login');
});

router.get('/register', (req, res) => {
    res.render('auth/register');
});

router.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

router.get(
    '/produtos',
    produtoController.renderProdutosIndex
);

router.get(
    '/produtos/novo',
    produtoController.renderProdutoCreate
);

router.get(
    '/produtos/:id/editar',
    produtoController.renderProdutoEdit
);

router.post(
    '/register',
    authController.register
);

router.post(
    '/login',
    authController.login
)

const { User } = require('../models');

router.get(
    '/perfil',
    auth,
    async (req, res) => {
        try {
            const usuario = await User.findByPk(req.userId, {
                attributes: ['id', 'nome', 'email']
            });

            if (!usuario) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            return res.json({ usuario });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar perfil.' });
        }
    }
);

router.post(
    '/api/produtos',
    auth,
    produtoController.criarProduto
);

router.get(
    '/api/produtos',
    auth,
    produtoController.listarProdutos
);

router.put(
    '/api/produtos/:id',
    auth,
    produtoController.atualizarProduto
);

router.delete(
    '/api/produtos/:id',
    auth,
    produtoController.deletarProduto
);

module.exports = router;