/* eslint-disable consistent-return */
const db = require('../config/database');

// ==> Método que adicionará um produto na estante
exports.addProdutoNaEstante = async (req, res) => {
  const { idEstante, idProduto } = req.params;
  try {
    const insertQuery = 'INSERT INTO estante_produto (estante_id, produto_id) VALUES (? ,?)';
    db.execute(insertQuery, [idEstante, idProduto], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar os Produtos da Estante.',
        });
        return false;
      }
      res.status(201).send({
        message: `Produto adicionado na Estante de ID ${idEstante}`,
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('addProdutoNaEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao adicionar o Produto na Estante.' });
  }
};

// ==> Método que deletará um produto da estante
exports.deleteProdutoDaEstante = async (req, res) => {
  const { idEstante, idProduto } = req.params;
  try {
    const deleteQuery = 'DELETE FROM estante_produto WHERE estante_id = ? AND produto_id = ?';
    db.execute(deleteQuery, [idEstante, idProduto], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao excluir o Produto da Estante.',
        });
        return false;
      }
      res.status(201).send({
        message: `Produto excluído da Estante de ID ${idEstante}`,
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('deleteProdutoDaEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao deletar o Produto da Estante.' });
  }
};

// ==> Metodo que alterara a coluna 'ativo' do produto
exports.updateActiveStatus = async (req, res) => {
  try {
    const { ativo, estanteId, produtoId } = req.body;
    const query = 'UPDATE estante_produto SET ativo = ? WHERE estante_produto.estante_id = ? AND estante_produto.produto_id = ?;';
    db.execute(query, [ativo, estanteId, produtoId], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao atualizar o status do produto.',
        });
        return false;
      }
      res.status(201).send({
        message: `Status do produto ${produtoId} da estante ${estanteId} foi atualizado para ${ativo === 1 ? '"ATIVO"' : '"DESATIVADO"'}`,
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('deleteProdutoDaEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar o status do produto.' });
  }
};

// ==> Método que listará todos os produtos de uma estante específica
exports.listAllProdutosNaEstante = async (req, res) => {
  try {
    const selectQuery = 'SELECT produtos.nome as nome_produto, produtos.preco_custo, produtos.unidade_medida from estante_produto INNER JOIN produtos ON estante_produto.produto_id = produtos.id WHERE estante_id = ?';
    db.execute(selectQuery, [req.params.id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar os Produtos da Estante.',
        });
        return false;
      }
      res.status(200).send({ estante: results });
    });
  } catch (error) {
    console.error('listAllProdutosNaEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os produtos na estante.' });
  }
};

exports.copiarEstanteSimples = async (req, res) => {
  console.log(req.body);
  const { estanteOrigemId, estanteDestinoId } = req.body.dados;

  try {
    // Validação
    if (!estanteOrigemId || !estanteDestinoId) {
      return res.status(400).send({
        userMessage: 'IDs da estante de origem e destino são obrigatórios.',
      });
    }

    // Query de cópia usando INSERT IGNORE
    const copiarQuery = `
      INSERT IGNORE INTO estante_produto (estante_id, produto_id, preco_quantidade_id, ativo)
      SELECT 
        ?,
        produto_id,
        preco_quantidade_id,
        ativo
      FROM estante_produto 
      WHERE estante_id = ?
    `;

    db.execute(copiarQuery, [estanteDestinoId, estanteOrigemId], (err, results) => {
      if (err) {
        return res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao copiar produtos da estante.',
        });
      }

      // Resposta de sucesso
      res.status(201).send({
        message: 'Produtos copiados com sucesso!',
        detalhes: {
          estanteOrigemId,
          estanteDestinoId,
          produtosCopiados: results.affectedRows,
          affectedRows: results.affectedRows,
          insertId: results.insertId,
        },
      });
    });
  } catch (error) {
    console.error('copiarEstanteSimples', error);
    res.status(500).send({
      message: 'Ocorreu um erro ao copiar produtos.',
      developMessage: error.message,
    });
  }
};
