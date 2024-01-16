const express = require('express');

const router = express.Router();
const itemPedidoController = require('../controllers/item-pedido.controller');

// ==> POST http://localhost:3000/api/pedido/pedidoId/adicionar
router.post('/pedido/:pedidoId/adicionar', itemPedidoController.adicionarItemAoPedido);

// ==> PUT http://localhost:3000/api/pedido/pedidoId/atualizar/itemPedidoId
router.put('/pedido/:pedidoId/atualizar/:itemPedidoId', itemPedidoController.atualizaItemNoPedido);

// ==> DELETE http://localhost:3000/api/pedido/itemPedidoId
router.delete('/pedido/:pedidoId/item-pedido/:itemPedidoId/:quantidade/estante-id/:estanteId/produto-id/:produtoId', itemPedidoController.deletarItemPedido);

module.exports = router;
