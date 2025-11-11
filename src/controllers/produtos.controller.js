/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
const db = require('../config/database');

// ==> Método que cria o produto no Banco de Dados.
exports.createProduto = async (req, res) => {
  const {
    nome, precoCusto, unidadeMedidaId,
  } = req.body;
  try {
    const insertQuery = 'INSERT INTO produtos (nome, preco_custo, unidade_medida_id, ativo) VALUES (?, ?, ?, ?)';
    db.execute(insertQuery, [nome, precoCusto, unidadeMedidaId, 1], (err, results) => {
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
            unidadeMedidaId,
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
    nome, precoCusto, unidadeMedidaId, id,
  } = req.body;
  try {
    const updateQuery = 'UPDATE produtos SET nome = ?, preco_custo = ?, unidade_medida_id = ? WHERE id = ?';
    db.execute(updateQuery, [nome, precoCusto, unidadeMedidaId, id], (err, results) => {
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
        unidadeMedidaId,
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

// ==> Método que retorna todos os Produtos cadastrados (para usuários comuns).
exports.listAllProdutos = async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.nome, p.preco_custo as preco, u.sigla as unidade, p.ativo 
      FROM produtos p 
      INNER JOIN unidades_medida u ON p.unidade_medida_id = u.id 
      WHERE p.ativo = 1
    `;
    db.execute(query, (err, results) => {
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

// ==> Método que retorna todos os Produtos cadastrados (para administradores).
exports.listAllProdutosParaAdmin = async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.nome, p.preco_custo as preco, u.sigla as unidade, p.ativo 
      FROM produtos p 
      INNER JOIN unidades_medida u ON p.unidade_medida_id = u.id
    `;
    db.execute(query, (err, results) => {
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
    console.error('listAllProdutosParaAdmin', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os produtos.' });
  }
};

// ==> Método que retorna um produto específico.
exports.listOneProduto = async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.sigla as unidade_medida_sigla, u.descricao as unidade_medida_descricao 
      FROM produtos p 
      INNER JOIN unidades_medida u ON p.unidade_medida_id = u.id 
      WHERE p.id = ? AND p.ativo = 1
    `;
    db.execute(query, [req.params.id], (err, results) => {
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

// ==> Método que lista produtos para compra baseado em pedidos confirmados.
exports.listAllProdutosForBuying = async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.body;
    const selectQuery = `
      SELECT p.nome as nome, u.sigla as unidadeMedida, SUM(ip.quantidade) AS quantidade 
      FROM pedidos pd
      INNER JOIN item_pedido ip ON pd.id = ip.pedido_id
      INNER JOIN produtos p ON ip.produto_id = p.id
      INNER JOIN unidades_medida u ON p.unidade_medida_id = u.id
      WHERE pd.status = 'CONFIRMADO' AND pd.data_entrega BETWEEN ? AND ?
      AND p.ativo = 1
      GROUP BY p.id, p.nome, u.sigla
      ORDER BY p.nome ASC
    `;

    db.execute(selectQuery, [dataInicial, dataFinal], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar os produtos nessa data.',
        });
        return false;
      }

      res.status(200).send({ produtos: results });
    });
  } catch (error) {
    console.error('listAllProdutosForBuying', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os produtos nessa data.' });
  }
};

// ==> Método que atualiza o status de um produto.
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
