const express = require('express');

const router = express.Router();
const unidadesMedidaController = require('../controllers/unidades-medida.controller');

router.post('/unidades-medida', unidadesMedidaController.createUnidadeMedida);
router.get('/unidades-medida', unidadesMedidaController.listAllUnidadesMedida);
router.get('/unidades-medida/com-contagem', unidadesMedidaController.listUnidadesMedidaWithProductCount);
router.get('/unidades-medida/:id', unidadesMedidaController.listOneUnidadeMedida);
router.put('/unidades-medida/:id', unidadesMedidaController.updateUnidadeMedida);
router.delete('/unidades-medida/:id', unidadesMedidaController.deleteUnidadeMedida);
router.get('/unidades-medida/verificar-sigla/:sigla', unidadesMedidaController.checkSiglaExists);

module.exports = router;
