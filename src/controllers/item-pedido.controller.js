const db = require('../config/database');
const dbPromise = require('../config/databasePromise');
const {
  buscarPrecoVendaNaEstante,
  buscarPrecoUnitarioDoItem,
  calcularPrecoTotal,
  normalizarQuantidade,
  atualizarValorTotalPedido,
} = require('../utils/preco-pedido');

exports.adicionarItemAoPedido = async (req, res) => {
  const { estanteId, produtoId, quantidade: quantidadeRaw } = req.body;
  const { pedidoId } = req.params;
  const numberPedidoId = Number(pedidoId);

  try {
    const quantidade = normalizarQuantidade(quantidadeRaw);
    if (!quantidade) {
      res.status(400).send({
        userMessage: 'Quantidade inválida.',
      });
      return;
    }

    const precoUnitario = await buscarPrecoVendaNaEstante(estanteId, produtoId);
    if (precoUnitario === null) {
      res.status(404).send({
        userMessage: 'Produto não encontrado nesta estante.',
      });
      return;
    }

    const precoTotal = calcularPrecoTotal(precoUnitario, quantidade);
    const insertQuery = `INSERT INTO item_pedido
      (pedido_id, produto_id, estante_id, quantidade, preco_unitario, preco_total)
      VALUES (?, ?, ?, ?, ?, ?)`;

    const [result] = await dbPromise.execute(insertQuery, [
      numberPedidoId, produtoId, estanteId, quantidade, precoUnitario, precoTotal,
    ]);

    if (result.affectedRows === 0) {
      res.status(500).send({
        userMessage: 'Falha ao inserir o Item ao pedido.',
      });
      return;
    }

    req.body.quantidade = quantidade;
    await atualizarValorTotalPedido(numberPedidoId);
    this.atualizaQuantidadeAoInserir(req, res);

    res.status(201).send({
      message: 'Item adicionado ao Pedido com sucesso!',
      affectedRows: result.affectedRows,
      precoUnitario,
      precoTotal,
    });
  } catch (error) {
    res.status(500).send({
      developMessage: error.message,
      userMessage: 'Falha ao inserir o Item ao pedido.',
    });
  }
};

exports.atualizaItemNoPedido = async (req, res) => {
  const { produtoId, quantidadeNova: quantidadeNovaRaw } = req.body;
  const { pedidoId, itemPedidoId } = req.params;

  try {
    const quantidadeNova = normalizarQuantidade(quantidadeNovaRaw);
    if (!quantidadeNova) {
      res.status(400).send({
        userMessage: 'Quantidade inválida.',
      });
      return;
    }

    const precoUnitario = await buscarPrecoUnitarioDoItem(itemPedidoId);
    if (precoUnitario === null) {
      res.status(404).send({
        userMessage: 'Item do pedido não encontrado.',
      });
      return;
    }

    const precoTotal = calcularPrecoTotal(precoUnitario, quantidadeNova);
    const updateQuery = `UPDATE item_pedido
      SET pedido_id = ?, produto_id = ?, quantidade = ?, preco_unitario = ?, preco_total = ?
      WHERE id = ?`;

    const [result] = await dbPromise.execute(updateQuery, [
      pedidoId, produtoId, quantidadeNova, precoUnitario, precoTotal, itemPedidoId,
    ]);

    if (result.affectedRows === 0) {
      res.status(500).send({
        userMessage: 'Falha ao atualizar o Item do pedido.',
      });
      return;
    }

    req.body.quantidadeNova = quantidadeNova;
    await atualizarValorTotalPedido(pedidoId);
    this.atualizaQuantidadeAoAtualizar(req, res);

    res.status(201).send({
      message: 'Item atualizado no Pedido com sucesso!',
      affectedRows: result.affectedRows,
      precoUnitario,
      precoTotal,
    });
  } catch (error) {
    res.status(500).send({
      developMessage: error.message,
      userMessage: 'Falha ao atualizar o Item do pedido.',
    });
  }
};

exports.calculaValorTotal = async (req, res) => {
  const { pedidoId } = req.params;
  try {
    await atualizarValorTotalPedido(pedidoId);
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

    db.query(deleteQuery, async (error, results) => {
      if (error) {
        res.status(500).send({
          developMessage: error.message,
          userMessage: 'Ocorreu um erro ao Excluir o Item do Pedido..',
        });
        return;
      }
      res.status(200).send({
        message: 'Item excluído do Pedido com sucesso!',
        affectedRows: results.affectedRows,
      });

      try {
        await atualizarValorTotalPedido(req.params.pedidoId);
      } catch (valorTotalError) {
        console.error('atualizarValorTotalPedido', valorTotalError);
      }
    });
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
