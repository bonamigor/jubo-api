/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
const db = require('../config/database');

// ==> Método que cria o produto no Banco de Dados.
exports.createProduto = async (req, res) => {
  const {
    nome, precoCusto, unidadeMedida,
  } = req.body;
  try {
    const insertQuery = 'INSERT INTO produtos (nome, preco_custo, unidade_medida, ativo) VALUES (?, ?, ?, ?)';
    db.execute(insertQuery, [nome, precoCusto, unidadeMedida, 1], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao criar o Produto.',
        });
        return false;
      }
      db.execute('SELECT LAST_INSERT_ID();', (error, result) => {
        if (err) {
          res.status(500).send({
            developMessage: error.message,
            userMessage: 'Falha ao recuperar ID do produto criado.',
          });
          return false;
        }

        res.status(201).send({
          message: 'Produto criado com sucesso!',
          produto: {
            id: Object.values(result[0])[0],
            nome,
            precoCusto,
            unidadeMedida,
            affectedRows: results.affectedRows,
          },
        });
      });
    });
  } catch (error) {
    console.error('createProduto', error);
    res.status(500).send({ message: 'Ocorreu um erro ao criar o Produto.' });
  }
};

// ==> Método que atualiza todas as propriedades do Produto.
exports.updateProduto = async (req, res) => {
  const {
    nome, precoCusto, unidadeMedida, id,
  } = req.body;
  try {
    const updateQuery = 'UPDATE produtos SET nome = ?, preco_custo = ?, unidade_medida = ? WHERE id = ?';
    db.execute(updateQuery, [nome, precoCusto, unidadeMedida, id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao atualizar o Produto.',
        });
        return false;
      }
      res.status(200).send({
        message: `Produto de ID ${id} atualizado com sucesso!`,
        nome,
        precoCusto,
        unidadeMedida,
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('updateProduto', error);
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar o Produto.' });
  }
};

// ==> Método que exclui um produto da Base de Dados.
exports.deleteProduto = async (req, res) => {
  try {
    db.execute('DELETE FROM produtos WHERE id = ?', [req.params.id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao excluir o Produto.',
        });
        return false;
      }
      res.status(200).send({
        message: 'Produto excluído com sucesso!',
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('deleteProduto', error);
    res.status(500).send({ message: 'Ocorreu um erro ao excluir o Produto.' });
  }
};

// ==> Método que retorna todos os Produtos cadastrados.
exports.listAllProdutos = async (req, res) => {
  try {
    db.execute('SELECT id, nome, preco_custo as preco, unidade_medida as unidade, ativo FROM produtos', (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar os Produtos.',
        });
        return false;
      }
      res.status(200).send({ produtos: results });
    });
  } catch (error) {
    console.error('listAllProdutos', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os produtos.' });
  }
};

exports.listOneProduto = async (req, res) => {
  try {
    db.execute('SELECT * FROM produtos WHERE id = ?',
      [req.params.id],
      (err, results) => {
        if (err) {
          res.status(500).send({
            developMessage: err.message,
            userMessage: 'Falha ao listar o Produto.',
          });
          return false;
        }
        res.status(200).send({ produto: results[0] });
      });
  } catch (error) {
    console.error('listOneProduto', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar o produto.' });
  }
};

exports.listAllProdutosForBuying = async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.body;
    const selectQuery = `
      SELECT produtos.nome as nome, produtos.unidade_medida as unidadeMedida, SUM(item_pedido.quantidade) AS quantidade FROM pedidos 
      INNER JOIN item_pedido ON pedidos.id = item_pedido.pedido_id
      INNER JOIN produtos ON item_pedido.produto_id = produtos.id
      WHERE status = 'CONFIRMADO' AND data_entrega BETWEEN ? AND ?
      GROUP BY produtos.nome, produtos.unidade_medida
      ORDER BY produtos.nome ASC
    `;

    db.execute(selectQuery, [dataInicial, dataFinal], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err,
          userMessage: 'Falha ao listar os produtos nessa data.',
        });
        return false;
      }

      res.status(200).send({ produtos: results });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao listar os produtos nessa data.' });
  }
};

// ==> Método que exclui um produto da Base de Dados.
exports.updateProductStatus = async (req, res) => {
  const {
    ativo,
  } = req.body;
  const novoStatusAtivo = ativo === 1 ? 0 : 1;
  try {
    db.execute('UPDATE produtos SET ativo = ? WHERE id = ?', [novoStatusAtivo, req.params.id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao atualizar o status do Produto.',
        });
        return false;
      }
      res.status(200).send({
        message: 'Produto atualizado com sucesso!',
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('updateProductStatus', error);
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar o status do Produto.' });
  }
};