const app = require('./src/index');

const port = process.env.PORT || '8080';

app.listen(port, () => {
  console.log('Aplicação sendo executada na porta:', port);
});
