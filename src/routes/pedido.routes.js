const express = require('express');
const asyncify = require('express-asyncify');

const router = asyncify(express.Router());
const pedidosController = require('../controllers/pedidos.controller');

// ==> GET http://localhost:3000/api/pedidos
router.get('/pedidos', pedidosController.listAllPedidos);

// ==> GET http://localhost:3000/api/pedidos
router.get('/pedidos/amanha', pedidosController.listAllTomorrowPedidos);

// ==> GET http://localhost:3000/api/pedidos/id
router.get('/pedidos/:pedidoId', pedidosController.listOnePedido);

// ==> PUT http://localhost:3000/api/pedidos/pedidoId/cancelar
router.put('/pedidos/:pedidoId/cancelar', pedidosController.cancelaPedido);

// ==> PUT http://localhost:3000/api/pedidos/pedidoId/cancelar
router.put('/pedidos/:pedidoId/cancelar-com-observacao', pedidosController.cancelaPedidComObservacao);

// ==> PUT http://localhost:3000/api/pedidos/pedidoId/confirmar
router.put('/pedidos/:pedidoId/confirmar', pedidosController.confirmaPedido);

// ==> PUT http://localhost:3000/api/pedidos/pedidoId/entregar
router.put('/pedidos/:pedidoId/entregar', pedidosController.entregaPedido);

// ==> PUT http://localhost:3000/api/pedidos/pedidoId/observacao
router.put('/pedidos/:pedidoId/observacao', pedidosController.adicionarObservacao);

router.patch('/pedidos/:pedidoId/alterar/entrega/:dataEntrega', pedidosController.atualizarDataEntrega);

router.patch('/pedidos/:pedidoId/entrega', pedidosController.setarPedidoComoEntregue);

router.patch('/pedidos/:pedidoId/empresa/:idEmpresa', pedidosController.setarEmpresaAoPedido);

router.put('/pedidos/:pedidoId/atualizar/valorTotal', pedidosController.atualizarValorTotal);

router.get('/pedidos/:pedidoId/recuperarValorTotal', pedidosController.recuperarValorTotal);

// ==> POST http://localhost:3000/api/pedidos
router.post('/pedidos', pedidosController.createPedido);

router.post('/pedidos/relatorio-data', pedidosController.ordersByClientReport);

router.post('/pedidos/relatorio-data/analitico', pedidosController.getProdutosDoPedido);

router.get('/pedidos/relatorio/datas/:dataInicial/to/:dataFinal', pedidosController.ordersBetweenDates);

router.patch('/pedidos/:pedidoId/finalizar', pedidosController.finalizarPedido);

// ==> DELETE http://localhost:3000/api/pedidos
router.delete('/pedidos/:pedidoId', pedidosController.deletePedido);

router.get('/pedidos/:pedidoId/produtos', pedidosController.recuperarProdutosNoPedido);

router.get('/pedidos/:pedidoId/valorTotal', pedidosController.calculaValorTotal);

router.get('/pedidos/ultimo/:clienteId', pedidosController.recuperarUltimoPedidoByCliente);

router.get('/pedidos/cliente/:clienteId', pedidosController.recuperarPedidosByCliente);

router.get('/estante/:estanteId/produto/:produtoId/precoVenda', pedidosController.recuperarPrecoVendaProduto);

module.exports = router;
