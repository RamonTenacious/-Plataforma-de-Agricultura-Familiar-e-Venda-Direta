const { Produto } = require('../models');

// CREATE
async function criarProduto(req, res) {

    try {

        const userId = req.userId;

        const {
            nome,
            descricao,
            preco,
            quantidade
        } = req.body;

        const produto = await Produto.create({
            nome,
            descricao,
            preco,
            quantidade,
            UserId: userId
        });

        return res.json(produto);

    } catch (error) {
        console.error('ERRO AO CRIAR PRODUTO:', error);
        return res.status(500).json({
            message: 'Erro ao criar produto',
            error: error.message
    });
}
}

// READ ALL
async function listarProdutos(req, res) {

    const produtos = await Produto.findAll();

    return res.json(produtos);
}

// UPDATE
async function atualizarProduto(req, res) {

    try {

        const { id } = req.params;

        await Produto.update(req.body, {
            where: { id }
        });

        return res.send('Produto atualizado');

    } catch (error) {

        return res
            .status(500)
            .send('Erro ao atualizar');
    }
}

// DELETE
async function deletarProduto(req, res) {

    try {

        const { id } = req.params;

        await Produto.destroy({
            where: { id }
        });

        return res.send('Produto deletado');

    } catch (error) {

        return res
            .status(500)
            .send('Erro ao deletar');
    }
}

module.exports = {
    criarProduto,
    listarProdutos,
    atualizarProduto,
    deletarProduto
};