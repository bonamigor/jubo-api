const express = require('express');

const router = express.Router();
const produtoController = require('../controllers/produtos.controller');

// ==> GET http://localhost:3000/api/produtos
router.get('/produtos', produtoController.listAllProdutos);

// ==> GET http://localhost:3000/api/produtos
router.get('/produtos/admin', produtoController.listAllProdutosParaAdmin);

// ==> GET http://localhost:3000/api/produtos/id
router.get('/produtos/:id', produtoController.listOneProduto);

// ==> POST http://localhost:3000/api/produtos/compras
router.post('/produtos/compras', produtoController.listAllProdutosForBuying);

// ==> POST http://localhost:3000/api/produtos
router.post('/produtos', produtoController.createProduto);

// ==> PUT http://localhost:3000/api/produtos
router.put('/produtos', produtoController.updateProduto);

// ==> DELETE http://localhost:3000/api/produtos/id
router.delete('/produtos/:id', produtoController.deleteProduto);

// ==> PUT http://localhost:3000/api/produtos/id/status
router.put('/produtos/:id/status', produtoController.updateProductStatus);

module.exports = router;
