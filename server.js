const app = require('./src/index');

const port = process.env.PORT || '8080';

const estanteController = require('./src/controllers/estantes.controller');

estanteController.selecionarClientes();
// estanteController.selecionarEstantes();

setTimeout(() => {
  estanteController.selecionarEstantes();
}, 10000);

app.listen(port, () => {
  console.log('Aplicação sendo executada na porta:', port);
});
