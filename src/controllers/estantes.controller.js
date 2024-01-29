/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
const { format } = require('date-fns');
const db = require('../config/database');

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
