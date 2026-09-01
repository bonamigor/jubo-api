const dbPromise = require('../config/databasePromise');

const SELECT_PRECO_VENDA = `
  SELECT pq.preco_venda
  FROM estante_produto ep
  INNER JOIN preco_quantidade pq ON pq.id = ep.preco_quantidade_id
  WHERE ep.estante_id = ? AND ep.produto_id = ?
`;

async function buscarPrecoVendaNaEstante(estanteId, produtoId) {
  const [rows] = await dbPromise.execute(SELECT_PRECO_VENDA, [estanteId, produtoId]);
  if (!rows.length) return null;
  return Number(rows[0].preco_venda);
}

async function buscarPrecoUnitarioDoItem(itemPedidoId) {
  const [rows] = await dbPromise.execute(
    'SELECT preco_unitario, preco_total, quantidade FROM item_pedido WHERE id = ?',
    [itemPedidoId],
  );
  if (!rows.length) return null;

  const { preco_unitario: precoUnitario, preco_total: precoTotal, quantidade } = rows[0];

  if (precoUnitario != null && precoUnitario > 0) {
    return Number(precoUnitario);
  }

  if (quantidade > 0) {
    return Number(precoTotal) / Number(quantidade);
  }

  return null;
}

function calcularPrecoTotal(precoUnitario, quantidade) {
  return Math.round(precoUnitario * quantidade * 100) / 100;
}

const CASAS_DECIMAIS_QUANTIDADE = 6;

function normalizarQuantidade(quantidade) {
  const numero = Number(quantidade);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  const fator = 10 ** CASAS_DECIMAIS_QUANTIDADE;
  const arredondada = Math.round(numero * fator) / fator;
  if (arredondada <= 0) return null;
  return arredondada;
}

async function atualizarValorTotalPedido(pedidoId) {
  await dbPromise.execute(
    `UPDATE pedidos
     SET valor_total = (
       SELECT COALESCE(SUM(ROUND(preco_unitario * quantidade, 2)), 0)
       FROM item_pedido WHERE pedido_id = ?
     )
     WHERE id = ?`,
    [pedidoId, pedidoId],
  );
}

module.exports = {
  buscarPrecoVendaNaEstante,
  buscarPrecoUnitarioDoItem,
  calcularPrecoTotal,
  normalizarQuantidade,
  atualizarValorTotalPedido,
  CASAS_DECIMAIS_QUANTIDADE,
};
