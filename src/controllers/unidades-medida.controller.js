/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
const db = require('../config/database');

// ==> Método que cria uma unidade de medida no Banco de Dados.
exports.createUnidadeMedida = async (req, res) => {
  const {
    sigla, descricao,
  } = req.body;
  try {
    const insertQuery = 'INSERT INTO unidades_medida (sigla, descricao) VALUES (?, ?)';
    db.execute(insertQuery, [sigla, descricao], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao criar a Unidade de Medida.',
        });
        return false;
      }
      db.execute('SELECT LAST_INSERT_ID();', (error, result) => {
        if (error) {
          res.status(500).send({
            developMessage: error.message,
            userMessage: 'Falha ao recuperar ID da unidade de medida criada.',
          });
          return false;
        }

        res.status(201).send({
          message: 'Unidade de Medida criada com sucesso!',
          unidadeMedida: {
            id: Object.values(result[0])[0],
            sigla,
            descricao,
            affectedRows: results.affectedRows,
          },
        });
      });
    });
  } catch (error) {
    console.error('createUnidadeMedida', error);
    res.status(500).send({ message: 'Ocorreu um erro ao criar a Unidade de Medida.' });
  }
};

// ==> Método que atualiza uma unidade de medida.
exports.updateUnidadeMedida = async (req, res) => {
  const {
    sigla, descricao, id,
  } = req.body;
  try {
    const updateQuery = 'UPDATE unidades_medida SET sigla = ?, descricao = ? WHERE id = ?';
    db.execute(updateQuery, [sigla, descricao, id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao atualizar a Unidade de Medida.',
        });
        return false;
      }
      res.status(200).send({
        message: `Unidade de Medida de ID ${id} atualizada com sucesso!`,
        unidadeMedida: {
          id,
          sigla,
          descricao,
          affectedRows: results.affectedRows,
        },
      });
    });
  } catch (error) {
    console.error('updateUnidadeMedida', error);
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar a Unidade de Medida.' });
  }
};

// ==> Método que exclui uma unidade de medida da Base de Dados.
exports.deleteUnidadeMedida = async (req, res) => {
  try {
    // Verificar se existem produtos usando esta unidade de medida
    const checkQuery = 'SELECT COUNT(*) as count FROM produtos WHERE unidade_medida_id = ?';
    db.execute(checkQuery, [req.params.id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao verificar uso da Unidade de Medida.',
        });
        return false;
      }

      const { count } = results[0];
      if (count > 0) {
        res.status(400).send({
          message: 'Não é possível excluir esta unidade de medida pois existem produtos vinculados a ela.',
          produtosVinculados: count,
        });
        return false;
      }

      // Se não houver produtos vinculados, prosseguir com a exclusão
      db.execute('DELETE FROM unidades_medida WHERE id = ?', [req.params.id], (deleteErr, deleteResults) => {
        if (deleteErr) {
          res.status(500).send({
            developMessage: deleteErr.message,
            userMessage: 'Falha ao excluir a Unidade de Medida.',
          });
          return false;
        }
        res.status(200).send({
          message: 'Unidade de Medida excluída com sucesso!',
          affectedRows: deleteResults.affectedRows,
        });
      });
    });
  } catch (error) {
    console.error('deleteUnidadeMedida', error);
    res.status(500).send({ message: 'Ocorreu um erro ao excluir a Unidade de Medida.' });
  }
};

// ==> Método que retorna todas as Unidades de Medida cadastradas.
exports.listAllUnidadesMedida = async (req, res) => {
  try {
    const query = 'SELECT id, sigla, descricao FROM unidades_medida ORDER BY sigla ASC';
    db.execute(query, (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar as Unidades de Medida.',
        });
        return false;
      }
      res.status(200).send({ unidadesMedida: results });
    });
  } catch (error) {
    console.error('listAllUnidadesMedida', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar as unidades de medida.' });
  }
};

// ==> Método que retorna uma unidade de medida específica.
exports.listOneUnidadeMedida = async (req, res) => {
  try {
    const query = 'SELECT id, sigla, descricao FROM unidades_medida WHERE id = ?';
    db.execute(query, [req.params.id], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar a Unidade de Medida.',
        });
        return false;
      }
      if (results.length === 0) {
        res.status(404).send({ message: 'Unidade de Medida não encontrada.' });
        return false;
      }
      res.status(200).send({ unidadeMedida: results[0] });
    });
  } catch (error) {
    console.error('listOneUnidadeMedida', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar a unidade de medida.' });
  }
};

// ==> Método que retorna unidades de medida com contagem de produtos associados.
exports.listUnidadesMedidaWithProductCount = async (req, res) => {
  try {
    const query = `
      SELECT 
        um.id, 
        um.sigla, 
        um.descricao,
        COUNT(p.id) as quantidade_produtos
      FROM unidades_medida um
      LEFT JOIN produtos p ON um.id = p.unidade_medida_id
      GROUP BY um.id, um.sigla, um.descricao
      ORDER BY um.sigla ASC
    `;
    db.execute(query, (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar as Unidades de Medida com contagem de produtos.',
        });
        return false;
      }
      res.status(200).send({ unidadesMedida: results });
    });
  } catch (error) {
    console.error('listUnidadesMedidaWithProductCount', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar as unidades de medida com contagem de produtos.' });
  }
};

// ==> Método que verifica se uma sigla já existe.
exports.checkSiglaExists = async (req, res) => {
  try {
    const { sigla } = req.params;
    const query = 'SELECT COUNT(*) as count FROM unidades_medida WHERE sigla = ?';
    db.execute(query, [sigla], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao verificar a sigla.',
        });
        return false;
      }
      res.status(200).send({
        exists: results[0].count > 0,
        sigla,
      });
    });
  } catch (error) {
    console.error('checkSiglaExists', error);
    res.status(500).send({ message: 'Ocorreu um erro ao verificar a sigla.' });
  }
};
