/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
const db = require('../config/database');

/*
 Método que retornará uma lista de produtos
 de uma determinada estante com os seus preços de venda
 e quantidades
*/
exports.listarDetalhadoNaEstante = async (req, res) => {
  try {
    const selectQuery = `SELECT produto_id as produtoId, produtos.nome AS nome,
    produtos.preco_custo as precoCusto, produtos.unidade_medida as unidade,
    preco_quantidade.preco_venda as precoVenda, preco_quantidade.quantidade, estante_produto.ativo as ativo
    FROM estante_produto
    INNER JOIN produtos ON estante_produto.produto_id = produtos.id
    INNER JOIN preco_quantidade ON estante_produto.preco_quantidade_id = preco_quantidade.id
    WHERE estante_produto.estante_id = ? AND produtos.ativo = 1`;

    db.execute(selectQuery, [req.params.id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar os Produtos da Estante com detalhes.',
        });
        return false;
      }
      res.status(200).send({ estante: { produtos: results } });
    });
  } catch (error) {
    console.error('listAllProdutosNaEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os produtos na estante.' });
  }
};

/*
 Método que retornará uma lista de produtos
 de uma determinada estante com os seus preços de venda
 e quantidades (exceto produtos com quantidades <= 0)
*/
exports.listarDetalhadoNoPedido = async (req, res) => {
  try {
    const selectQuery = `SELECT produto_id as produtoId, produtos.nome AS nome,
    produtos.preco_custo as precoCusto, produtos.unidade_medida as unidade,
    preco_quantidade.preco_venda as precoVenda, preco_quantidade.quantidade
    FROM estante_produto
    INNER JOIN produtos ON estante_produto.produto_id = produtos.id
    INNER JOIN preco_quantidade ON estante_produto.preco_quantidade_id = preco_quantidade.id
    WHERE estante_produto.estante_id = ? 
    AND estante_produto.ativo = 1`;

    db.execute(selectQuery, [req.params.id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar os Produtos da Estante com detalhes.',
        });
        return false;
      }
      res.status(200).send({ estante: { produtos: results } });
    });
  } catch (error) {
    console.error('listAllProdutosNaEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os produtos na estante.' });
  }
};

/* Método que adicionará o produto à uma estante
   porém já com o preço de venda e a quantidade.
 */
exports.addProdutoNaEstanteComPrecoEQuantidade = async (req, res) => {
  const { idEstante, idProduto } = req.params;
  const { precoVenda, quantidade } = req.body;
  const insertQueryEstante = 'INSERT INTO estante_produto (estante_id, produto_id, preco_quantidade_id) VALUES (?, ?, ?)';
  const insertQueryPreco = 'INSERT INTO preco_quantidade (preco_venda, quantidade) VALUES (?, ?);';
  try {
    db.execute(insertQueryPreco, [precoVenda, quantidade], (err, result) => {
      if (err || !result.affectedRows) {
        res.status(500).send({
          developMessage: err,
          userMessage: 'Falha ao adicionar o preço/quantidade.',
        });
        return false;
      }
      db.execute(insertQueryEstante, [idEstante, idProduto, result.insertId], (error, results) => {
        if (error) {
          res.status(500).send({
            developMessage: error,
            userMessage: 'Falha ao adicionar o Produto da Estante.',
          });
          return false;
        }
        res.status(201).send({
          message: `Produto de ID ${idProduto} adicionado na Estante de ID ${idEstante}`,
          affectedRows: results.affectedRows,
        });
      });
    });
  } catch (error) {
    console.error('AddProdutoNaEstanteComPrecoEQuantidade', error);
    res.status(500).send({ message: 'Ocorreu um erro ao add os produtos na estante.' });
  }
};

exports.atualizarPrecoQuantidade = async (req, res) => {
  const { idEstante, idProduto } = req.params;
  const { precoVenda, quantidade } = req.body;

  try {
    const updateQuery = 'UPDATE preco_quantidade SET preco_venda = ?, quantidade = ? WHERE id = ((SELECT preco_quantidade_id FROM estante_produto WHERE estante_id = ? AND produto_id = ?))';
    db.execute(updateQuery, [precoVenda, quantidade, idEstante, idProduto], (error, results) => {
      if (error) {
        res.status(500).send({
          developMessage: error.message,
          userMessage: 'Falha ao atualizar o Produto da Estante.',
        });
        return false;
      }
      res.status(201).send({
        message: `Produto de ID ${idProduto} atualizado na Estante de ID ${idEstante}`,
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('atualizarPrecoQuantidade', error);
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar o produto na estante.' });
  }
};
