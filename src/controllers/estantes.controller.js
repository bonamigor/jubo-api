/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
const { format } = require('date-fns');
const db = require('../config/database');
const dbPromise = require('../config/databasePromise');

// ==> Método que cria uma estante
exports.createEstante = async (req, res) => {
  const {
    periodo, clienteId, observacao,
  } = req.body;
  let clienteName;
  try {
    const insertQuery = 'INSERT INTO estantes (periodo, cliente_id, observacao, ativa) VALUES (?, ?, ?, ?)';
    db.execute('SELECT nome FROM clientes WHERE id = ?', [clienteId], (err, results, fields) => {
      clienteName = results[0].name;
    });
    db.execute(insertQuery, [periodo, clienteId, observacao, 1], (erros, results, fields) => {
      if (erros) {
        res.status(500).send({
          developMessage: erros.message,
          userMessage: 'Falha ao criar a Estante.',
        });
        return false;
      }
      res.status(201).send({
        message: 'Estante criada com sucesso!',
        fields,
        estante: {
          periodo,
          clienteId,
          clienteName,
        },
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('createEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao criar a Estante.' });
  }
};

// ==> Método que atualiza uma estante
exports.updateEstante = async (req, res) => {
  const {
    periodo, clienteId, observacao, id,
  } = req.body;
  try {
    const updateQuery = 'UPDATE estantes SET periodo = ?, cliente_id = ?, observacao = ? WHERE id = ?';
    db.execute(updateQuery, [periodo, clienteId, observacao, id], (err, results, fields) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao atualizar a Estante.',
        });
        return false;
      }
      res.status(200).send({
        message: `Estante de ID ${id} atualizada com sucesso!`,
        periodo,
        clienteId,
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('updateEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar a Estante.' });
  }
};

// ==> Método que deleta uma estante
exports.deleteEstante = async (req, res) => {
  const { id } = req.params;
  try {
    db.execute('DELETE FROM estantes WHERE id = ?', [id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao excluir a Estante.',
        });
        return false;
      }
      res.status(200).send({
        message: 'Estante excluída com sucesso!',
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error('deleteEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao excluir a Estante.' });
  }
};

// ==> Método que retorno a Estante porém sem os dados do Cliente, apenas o ID
exports.listAllEstantes = async (req, res) => {
  try {
    db.execute('SELECT estantes.id as id, estantes.cliente_id as clienteId, clientes.nome as cliente, estantes.periodo as periodo, estantes.observacao as observacao, estantes.ativa as ativa FROM estantes INNER JOIN clientes ON estantes.cliente_id = clientes.id', (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar as Estantes.',
        });
        return false;
      }
      res.status(200).send({ estantes: results });
    });
  } catch (error) {
    console.error('listAllEstantes', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar as estantes.' });
  }
};

// ==> Método que retorna a Estante com os Dados do Cliente (Nome);
exports.listAllEstantesCliente = async (req, res) => {
  try {
    const selectQuery = 'SELECT estantes.id, periodo, clientes.id as clienteId, clientes.nome as cliente, estantes.observacao as observacao, estantes.ativa FROM estantes INNER JOIN clientes ON estantes.cliente_id = clientes.id where cliente_id = ? and ativa = 1';
    db.execute(selectQuery, [req.params.id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar as Estantes.',
        });
        return false;
      }
      res.status(200).send({ estantes: results });
    });
  } catch (error) {
    console.error('listAllEstantes', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar as estantes.' });
  }
};

// ==> Método que lista uma estante específica
exports.listOneEstante = async (req, res) => {
  try {
    db.execute('SELECT * from estantes WHERE id = ?',
      [req.params.id],
      (err, results) => {
        if (err) {
          res.status(500).send({
            developMessage: err.message,
            userMessage: 'Falha ao listar a Estante.',
          });
          return false;
        }
        res.status(200).send({ estante: results[0] });
      });
  } catch (error) {
    console.error('listOneEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar a estante.' });
  }
};

// ==> Método que ativa ou desativa uma estante específica
exports.alterarEstadoDaEstante = async (req, res) => {
  const { id, status } = req.params;
  const sql = 'UPDATE estantes SET ativa = ? WHERE id = ?';
  try {
    db.execute(sql, [status, id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err,
          userMessage: 'Falha ao desativar a Estante.',
        });
        return false;
      }
      res.status(200).send({ message: 'Estante desativada com sucesso!' });
    });
  } catch (error) {
    console.error('listOneEstante', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar a estante.' });
  }
};

exports.selecionarClientes = async () => {
  const selectQuery = 'SELECT id FROM clientes;';

  try {
    const [rows] = await dbPromise.execute(selectQuery);
    this.criarEstantesAPartirDeClientes(rows);
  } catch (error) {

  }
};

exports.criarEstantesAPartirDeClientes = async (clientes) => {
  const periodo = '2024/01';
  const observacao = 'Produtos Gerais';
  const insertQuery = 'INSERT INTO estantes (periodo, observacao, cliente_id, ativa) VALUES (?, ?, ?, 1);';

  for (let i = 0; i <= clientes.length - 1; i++) {
    // eslint-disable-next-line no-await-in-loop
    await dbPromise.execute(insertQuery, [periodo, observacao, clientes[i].id]);

    if (i === clientes.length - 1) {
      console.log('deu bom!');
    }
  }
};

exports.selecionarEstantes = async () => {
  const selectQuery = `SELECT id FROM estantes WHERE observacao LIKE ${'\'PRODUTOS G%\''};`;

  try {
    const [rows] = await dbPromise.execute(selectQuery);
    this.adicionarProdutosNasEstantes(rows);
  } catch (error) {
    console.error(error);
  }
};

exports.adicionarProdutosNasEstantes = async (estantes) => {
  const insertQueryPQ = 'INSERT INTO preco_quantidade (preco_venda, quantidade) VALUES (?, 1)';
  const insertQueryProduto = 'INSERT INTO estante_produto (estante_id, produto_id, preco_quantidade_id, ativo) VALUES (?, ?, ?, 1)';
  const produtos = [
    {
      produto_id: 988,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 989,
      preco_venda: '32.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 990,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 991,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 992,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 993,
      preco_venda: '26.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 994,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 995,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 996,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 997,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 999,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1000,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1003,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1004,
      preco_venda: '5.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1006,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1016,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1017,
      preco_venda: '35.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1018,
      preco_venda: '27.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1020,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1022,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1027,
      preco_venda: '25.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1028,
      preco_venda: '17.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1029,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1030,
      preco_venda: '30.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1031,
      preco_venda: '39.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1032,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1034,
      preco_venda: 29,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1036,
      preco_venda: '26.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1038,
      preco_venda: '25.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1039,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1041,
      preco_venda: '22.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1042,
      preco_venda: '23.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1044,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1046,
      preco_venda: '21.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1047,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1048,
      preco_venda: '21.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1049,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1050,
      preco_venda: '21.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1051,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1054,
      preco_venda: '17.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1056,
      preco_venda: '26.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1058,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1059,
      preco_venda: '40.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1060,
      preco_venda: '25.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1062,
      preco_venda: '35.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1065,
      preco_venda: '45.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1067,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1070,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1074,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1075,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1077,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1078,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1083,
      preco_venda: '22.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1084,
      preco_venda: '16.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1086,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1087,
      preco_venda: '3.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1088,
      preco_venda: '5.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1090,
      preco_venda: '45.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1094,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1106,
      preco_venda: '20.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1107,
      preco_venda: '36.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1108,
      preco_venda: '21.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1109,
      preco_venda: '39.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1110,
      preco_venda: '25.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1112,
      preco_venda: '25.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1113,
      preco_venda: '6.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1114,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1119,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1120,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1122,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1123,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1127,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1129,
      preco_venda: '22.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1130,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1131,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1132,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1133,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1134,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1135,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1136,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1137,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1138,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1141,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1142,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1145,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1146,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1147,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1148,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1149,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1151,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1152,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1155,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1163,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1164,
      preco_venda: '35.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1166,
      preco_venda: '39.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1167,
      preco_venda: '28.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1168,
      preco_venda: '26.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1175,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1176,
      preco_venda: '27.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1181,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1185,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1187,
      preco_venda: '24.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1188,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1191,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1197,
      preco_venda: '27.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1199,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1201,
      preco_venda: '28.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1204,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1215,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1216,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1217,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1228,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1249,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1251,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1254,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1259,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1264,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1282,
      preco_venda: '3.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1283,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1288,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1290,
      preco_venda: '39.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1291,
      preco_venda: '39.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1292,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1293,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1295,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1296,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1301,
      preco_venda: '28.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1303,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1305,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1306,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1307,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1314,
      preco_venda: '16.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1317,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1322,
      preco_venda: '27.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1323,
      preco_venda: '20.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1325,
      preco_venda: '46.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1327,
      preco_venda: '59.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1333,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1342,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1348,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1351,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1357,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1367,
      preco_venda: '17.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1373,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1377,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1378,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1381,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1394,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1395,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1396,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1397,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1400,
      preco_venda: '32.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1401,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1404,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1407,
      preco_venda: '30.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1411,
      preco_venda: '25.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1412,
      preco_venda: 60,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1415,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1419,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1420,
      preco_venda: 15,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1421,
      preco_venda: '3.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1423,
      preco_venda: '25.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1427,
      preco_venda: '5.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1429,
      preco_venda: '49.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1430,
      preco_venda: '59.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1431,
      preco_venda: '49.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1440,
      preco_venda: '24.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1442,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1443,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1445,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1446,
      preco_venda: '6.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1447,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1448,
      preco_venda: '6.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1450,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1452,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1454,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1455,
      preco_venda: '2.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1458,
      preco_venda: '45.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1459,
      preco_venda: '4.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1460,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1461,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1462,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1463,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1464,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1468,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1469,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1470,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1471,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1472,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1473,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1475,
      preco_venda: '23.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1477,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1478,
      preco_venda: '35.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1479,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1480,
      preco_venda: '25.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1481,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1483,
      preco_venda: '1.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1484,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1486,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1487,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1489,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1490,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1491,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1492,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1493,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1494,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1495,
      preco_venda: 60,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1496,
      preco_venda: 3,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1497,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1499,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1500,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1501,
      preco_venda: '16.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1505,
      preco_venda: '45.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1506,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1507,
      preco_venda: '4.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1510,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1515,
      preco_venda: '49.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1516,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1517,
      preco_venda: '27.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1521,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1527,
      preco_venda: '28.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1528,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1529,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1530,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1531,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1536,
      preco_venda: '18.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1539,
      preco_venda: '35.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1543,
      preco_venda: '99.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1544,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1545,
      preco_venda: '3.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1546,
      preco_venda: '7.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1548,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1549,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1550,
      preco_venda: 69,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1551,
      preco_venda: '23.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1552,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1555,
      preco_venda: '18.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1556,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1557,
      preco_venda: '16.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1558,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1559,
      preco_venda: '17.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1575,
      preco_venda: '21.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1585,
      preco_venda: '5.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1586,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1589,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1590,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1591,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1592,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1601,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1608,
      preco_venda: '24.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1610,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1611,
      preco_venda: '18.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1612,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1614,
      preco_venda: '23.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1617,
      preco_venda: '20.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1637,
      preco_venda: '49.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1659,
      preco_venda: '69.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1660,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1670,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1671,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1672,
      preco_venda: 3,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1673,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1674,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1675,
      preco_venda: '6.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1676,
      preco_venda: '17.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1684,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1702,
      preco_venda: '21.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1714,
      preco_venda: '24.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1716,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1718,
      preco_venda: '10.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1720,
      preco_venda: '17.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1721,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1722,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1725,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1727,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1728,
      preco_venda: '69.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1729,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1731,
      preco_venda: '15.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1732,
      preco_venda: '22.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1733,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1735,
      preco_venda: '47.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1736,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1741,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1746,
      preco_venda: '59.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1748,
      preco_venda: 120,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1754,
      preco_venda: 3,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1757,
      preco_venda: 3,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1759,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1762,
      preco_venda: '45.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1763,
      preco_venda: '33.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1766,
      preco_venda: '14.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1767,
      preco_venda: '47.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1768,
      preco_venda: '44.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1769,
      preco_venda: '39.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1774,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1784,
      preco_venda: '27.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1785,
      preco_venda: '35.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1788,
      preco_venda: '20.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1793,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1795,
      preco_venda: '11.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1810,
      preco_venda: 240,
      preco_quantidade_id: null,
    },
    {
      produto_id: 1811,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1812,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1813,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1814,
      preco_venda: '19.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1815,
      preco_venda: '12.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1816,
      preco_venda: '5.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1817,
      preco_venda: '5.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1818,
      preco_venda: '23.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1820,
      preco_venda: '13.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1821,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1822,
      preco_venda: '9.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1823,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1824,
      preco_venda: '29.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1825,
      preco_venda: '4.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1826,
      preco_venda: '1.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1827,
      preco_venda: '5.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1830,
      preco_venda: '21.99',
      preco_quantidade_id: null,
    },
    {
      produto_id: 1831,
      preco_venda: '8.99',
      preco_quantidade_id: null,
    },
  ];

  for (let i = 0; i <= produtos.length - 1; i++) {
    await dbPromise.execute(insertQueryPQ, [produtos[i].preco_venda]);
    const [rows] = await dbPromise.execute('SELECT LAST_INSERT_ID() as last_id;');
    produtos[i].preco_quantidade_id = rows[0].last_id;
    // console.log('ULTIMO ID: ', rows[0].last_id);

    // if (i === produtos.length - 1) {
    //   // console.log(produtos);
    // }
  }

  for (let j = 0; j <= estantes.length - 1; j++) {
    for (let k = 0; k <= produtos.length - 1; k++) {
      await dbPromise.execute(insertQueryProduto, [estantes[j].id, produtos[k].produto_id, produtos[k].preco_quantidade_id]);
    }

    if (j === estantes.length - 1) {
      console.log('deu bom again!11!!1!!');
    }
  }

  // for (let i = 0; i <= produtos.length - 1; i++) {
  //   // eslint-disable-next-line no-await-in-loop
  //   await dbPromise.execute(insertQueryPQ, [produtos[i].preco_venda]);

  //   db.execute('SELECT LAST_INSERT_ID();', (error, result) => {
  //     produtos[i].preco_quantidade_id = result[0]
  //   });

  // if (i === clientes.length - 1) {
  //   console.log('deu bom again!11!!1!!');
  // }
  // }

  // for (let j = 0; i <= estantes.length - 1; j++) {
  //   await dbPromise.execute(insertQueryProduto, [estantes[j].id, produtos[j].produto_id, produtos[j].preco_quantidade_id]);
  // }
};
