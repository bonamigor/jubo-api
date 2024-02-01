const db = require('../config/database');

exports.adicionarItemAoPedido = async (req, res) => {
  const {
    estanteId, produtoId, precoVenda, quantidade,
  } = req.body;
  const { pedidoId } = req.params;
  const numberPedidoId = Number(pedidoId);
  const insertQuery = 'INSERT INTO item_pedido (pedido_id, produto_id, estante_id, quantidade, preco_total) VALUES (?, ?, ?, ?, ?)';

  const precoTotal = precoVenda * quantidade;
  db.execute(insertQuery,
    [numberPedidoId, produtoId, estanteId, quantidade, precoTotal],
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.status(500).send({
          developMessage: error.message,
          userMessage: 'Falha ao inserir o Item ao pedido.',
        });
        return false;
      }
      res.status(201).send({
        message: 'Item adicionado ao Pedido com sucesso!',
        affectedRows: result.affectedRows,
      });
      this.calculaValorTotal(req, res);
      this.atualizaQuantidadeAoInserir(req, res);
    });
};

exports.atualizaItemNoPedido = async (req, res) => {
  const {
    produtoId, precoVenda, quantidadeNova,
  } = req.body;
  const { pedidoId, itemPedidoId } = req.params;
  const updateQuery = 'UPDATE item_pedido SET pedido_id = ?, produto_id = ?, quantidade = ?, preco_total = ? WHERE id = ?';

  const precoTotal = precoVenda * quantidadeNova;
  db.execute(updateQuery,
    [pedidoId, produtoId, quantidadeNova, precoTotal, itemPedidoId],
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.status(500).send({
          developMessage: error.message,
          userMessage: 'Falha ao atualizar o Item do pedido.',
        });
        return false;
      }
      res.status(201).send({
        message: 'Item atualizado no Pedido com sucesso!',
        affectedRows: result.affectedRows,
      });
      this.calculaValorTotal(req, res);
      this.atualizaQuantidadeAoAtualizar(req, res);
    });
};

exports.calculaValorTotal = async (req, res) => {
  const { pedidoId } = req.params;
  const query = `UPDATE pedidos SET valor_total = (SELECT SUM(preco_total) as total FROM item_pedido WHERE pedido_id = ${pedidoId}) WHERE id = ${pedidoId}`;
  try {
    db.query(query);
  } catch (error) {
    res.status(500).send({
      message: 'Ocorreu um erro ao calcular o valor total do Pedido.',
      erro: error,
    });
  }
};

exports.atualizaQuantidadeAoInserir = async (req, res) => {
  const { estanteId, produtoId, quantidade } = req.body;
  const query = `UPDATE preco_quantidade SET quantidade = quantidade - ${quantidade} WHERE id = (SELECT preco_quantidade_id FROM estante_produto WHERE estante_id = ${estanteId} and produto_id = ${produtoId})`;
  try {
    db.query(query);
  } catch (error) {
    res.status(500).send({
      message: 'Ocorreu um erro ao atualizar a quantidade do Produto.',
      erro: error,
    });
  }
};

exports.atualizaQuantidadeAoAtualizar = async (req, res) => {
  const {
    estanteId, produtoId, quantidadeAntiga, quantidadeNova,
  } = req.body;
  const selectQuery = `SELECT preco_quantidade_id FROM estante_produto WHERE estante_id = ${estanteId} AND produto_id = ${produtoId}`;
  const quantidadeQuery = 'SELECT quantidade FROM preco_quantidade WHERE id = ?';
  const updateQuery = 'UPDATE preco_quantidade SET quantidade = ? WHERE id = ?';
  try {
    db.query(selectQuery, (erro, result) => {
      const precoQuantidadeId = result[0].preco_quantidade_id;
      db.execute(quantidadeQuery, [precoQuantidadeId], (error, results) => {
        const resultado = quantidadeAntiga - quantidadeNova;
        const quantidadeAtualizada = results[0].quantidade + resultado;
        db.execute(updateQuery, [quantidadeAtualizada, precoQuantidadeId]);
      });
    });
  } catch (error) {
    res.status(500).send({
      message: 'Ocorreu um erro ao atualizar a quantidade do Produto.',
      erro: error,
    });
  }
};

exports.deletarItemPedido = async (req, res) => {
  try {
    const { quantidade } = req.body;
    const {
      itemPedidoId, estanteId, produtoId,
    } = req.params;
    const deleteQuery = `DELETE FROM item_pedido where item_pedido.id = ${itemPedidoId}`;
    
    db.query(deleteQuery, (error, results) => {
      if (error) {
        res.status(500).send({
          developMessage: error.message,
          userMessage: 'Ocorreu um erro ao Excluir o Item do Pedido..',
        });
        return false;
      }
      res.status(200).send({
        message: 'Item excluído do Pedido com sucesso!',
        affectedRows: results.affectedRows,
      });
    });
    this.calculaValorTotal(req, res);
    this.atualizaQuantidadeAoDeletar(req, res, estanteId, produtoId, quantidade);
  } catch (error) {
    res.status(500).send({
      message: 'Ocorreu um erro ao Excluir o Item do Pedido.',
      erro: error,
    });
  }
};

exports.atualizaQuantidadeAoDeletar = async (req, res, estanteId, produtoId, quantidade) => {
  const query = `UPDATE preco_quantidade SET quantidade = quantidade + ${quantidade} WHERE id = (SELECT preco_quantidade_id FROM estante_produto WHERE estante_id = ${estanteId} and produto_id = ${produtoId})`;
  try {
    db.query(query);
  } catch (error) {
    res.status(500).send({
      message: 'Ocorreu um erro ao atualizar a quantidade do Produto.',
      erro: error,
    });
  }
};
