/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
const { format } = require('date-fns');
const db = require('../config/database');
const dbPromise = require('../config/databasePromise');

// ==> Método que adicionará um pedido ao banco de dados
exports.createPedido = async (req, res) => {
  const { clienteId } = req.body;
  const dataCriacao = new Date().getTime();
  try {
    const insertQuery = 'INSERT INTO pedidos (data_criacao, status, cliente_id) VALUES (?, ?, ?)';
    db.execute(insertQuery, [dataCriacao, 'CRIADO', clienteId],
      (err, results) => {
        db.execute('SELECT MAX (id) as id FROM pedidos', (erros, resultados) => {
          if (err || erros) {
            res.status(500).send({
              developMessage: err.message,
              userMessage: 'Falha ao criar o Pedido.',
            });
            return false;
          }
          res.status(201).send({
            message: 'Pedido criado com sucesso!',
            pedido: {
              pedidoId: resultados[0].id, status: 'CRIADO', dataCriacao, clienteId,
            },
            affectedRows: results.affectedRows,
          });
        });
      });
  } catch (error) {
    console.error('createPedido', error);
    res.status(500).send({ message: 'Ocorreu um erro ao criar o Pedido.' });
  }
};

// ==> Método que atualizará a data de confirmação e o status
exports.confirmaPedido = async (req, res) => {
  const { dataEntrega } = req.body;
  const { pedidoId } = req.params;
  const dataConfirmacao = new Date().getTime();
  const status = 'CONFIRMADO';
  try {
    const updateQuery = 'UPDATE pedidos SET data_confirmacao = ?, data_entrega = ?, status = ? WHERE id = ?';
    db.execute(updateQuery,
      [dataConfirmacao, dataEntrega, status, pedidoId],
      (err, results) => {
        if (err) {
          res.status(500).send({
            developMessage: err.message,
            userMessage: 'Falha ao confirmar o Pedido.',
          });
          return false;
        }
        res.status(201).send({
          message: 'Pedido confirmado com sucesso!',
          pedido: {
            pedidoId, dataConfirmacao, status,
          },
          affectedRows: results.affectedRows,
        });
      });
  } catch (error) {
    console.error('confirmaPedido', error);
    res.status(500).send({ message: 'Ocorreu um erro ao confirmar o Pedido.' });
  }
};

// ==> Método que atualizará a data de entrega e o status
exports.entregaPedido = async (req, res) => {
  const { pedidoId } = req.params;
  const dataEntrega = new Date().getTime();
  const status = 'ENTREGUE';
  try {
    const updateQuery = 'UPDATE pedidos SET data_entrega = ?, status = ? WHERE id = ?';
    db.execute(updateQuery,
      [dataEntrega, status, pedidoId],
      (err, results) => {
        if (err) {
          res.status(500).send({
            developMessage: err.message,
            userMessage: 'Falha ao alterar o status do Pedido para ENTREGUE.',
          });
          return false;
        }
        res.status(201).send({
          message: 'Pedido entregue com sucesso!',
          pedido: {
            pedidoId, dataEntrega, status,
          },
          affectedRows: results.affectedRows,
        });
      });
  } catch (error) {
    console.error('entregaPedido', error);
    res.status(500).send({ message: 'Ocorreu um erro ao confirmar o Pedido.' });
  }
};

exports.adicionarObservacao = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { observacao } = req.body;
    const updateQuery = 'UPDATE pedidos SET observacao = ? WHERE id = ?';
    db.execute(updateQuery, [observacao, pedidoId], (error, results) => {
      if (error) {
        res.status(500).send({
          developMessage: error.message,
          userMessage: 'Falha ao confirmar ao adicionar a Observação ao Pedido.',
        });
        return false;
      }

      res.status(201).send({
        message: 'Observação adicionada ao pedido.',
        pedido: {
          pedidoId, observacao,
        },
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao adicionar a Observação ao Pedido.' });
  }
};

// ==> Método que adicionará uma data de cancelamento e o status para CANCELADO
exports.cancelaPedido = async (req, res) => {
  const { pedidoId } = req.params;
  const dataCancelamento = new Date().getTime();
  const statusPedido = 'CANCELADO';
  const updateQuery = 'UPDATE pedidos SET data_cancelamento = ?, status = ? WHERE id = ?';
  try {
    const selectPedido = 'SELECT * FROM pedidos WHERE id = ?';
    db.execute(selectPedido, [pedidoId], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao recuperar o Pedido.',
        });
        return false;
      }

      const { status } = results[0];
      if (status === 'ENTREGUE' || status === 'CANCELADO') {
        res.status(500).send({
          userMessage: 'Não é possível cancelar um pedido que já foi entregue ou cancelado.',
        });
        return false;
      }

      db.execute(updateQuery,
        [dataCancelamento, statusPedido, pedidoId],
        (erro, result) => {
          if (erro) {
            res.status(500).send({
              developMessage: erro.sqlMessage,
              userMessage: 'Falha ao alterar o status do Pedido para CANCELADO.',
            });
            return false;
          }
          res.status(200).send({
            message: 'Pedido cancelado com sucesso!',
            pedido: {
              pedidoId, dataCancelamento, statusPedido,
            },
            affectedRows: result.affectedRows,
          });
        });
    });
  } catch (error) {
    console.error('cancelaPedido', error);
    res.status(500).send({ message: 'Ocorreu um erro ao cancelar o Pedido.' });
  }
};

exports.cancelaPedidComObservacao = async (req, res) => {
  const { observacao } = req.body;
  const { pedidoId } = req.params;
  const dataCancelamento = new Date().getTime();
  const statusPedido = 'CANCELADO';
  const updateQuery = 'UPDATE pedidos SET data_cancelamento = ?, obsCancelamento = ?, status = ? WHERE id = ?';
  try {
    const selectPedido = 'SELECT * FROM pedidos WHERE id = ?';
    db.execute(selectPedido, [pedidoId], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao recuperar o Pedido.',
        });
        return false;
      }

      const { status } = results[0];
      if (status === 'ENTREGUE' || status === 'CANCELADO') {
        res.status(500).send({
          userMessage: 'Não é possível cancelar um pedido que já foi entregue ou cancelado.',
        });
        return false;
      }

      db.execute(updateQuery,
        [dataCancelamento, observacao, statusPedido, pedidoId],
        (erro, result) => {
          if (erro) {
            res.status(500).send({
              developMessage: erro.sqlMessage,
              userMessage: 'Falha ao alterar o status do Pedido para CANCELADO.',
            });
            return false;
          }
          res.status(200).send({
            message: 'Pedido cancelado com sucesso!',
            pedido: {
              pedidoId, dataCancelamento, statusPedido,
            },
            affectedRows: result.affectedRows,
          });
        });
    });
  } catch (error) {
    console.error('cancelaPedido', error);
    res.status(500).send({ message: 'Ocorreu um erro ao cancelar o Pedido.' });
  }
};

// ==> Método que deletará os itens do Pedido além do Pedido em si.
exports.deletePedido = async (req, res) => {
  const { pedidoId } = req.params;
  try {
    db.execute('DELETE FROM pedidos WHERE id = ?', [pedidoId], (erro, result) => {
      if (erro || result.affectedRows === 0) {
        res.status(500).send({
          developMessage: erro.sqlMessage,
          userMessage: 'Falha ao deletar o Pedido.',
        });
        return false;
      }
      res.status(200).send({
        message: 'Pedido excluído com sucesso!',
        affectedRows: result.affectedRows,
      });
    });
  } catch (error) {
    console.error('deleteCliente', error);
    res.status(500).send({ message: 'Ocorreu um erro ao excluir o Cliente.' });
  }
};

// ==> Método que listará todos os pedidos
exports.listAllPedidos = async (req, res) => {
  const selectQuery = 'SELECT pedidos.id AS id, pedidos.data_criacao AS dataCriacao, pedidos.valor_total AS valorTotal, pedidos.status as status, pedidos.observacao as observacao, pedidos.obsCancelamento as obsCancelamento, pedidos.is_finalizado as isFinalizado, clientes.nome AS nome, clientes.endereco AS endereco, clientes.cidade AS cidade, clientes.estado AS estado, clientes.telefone AS telefone FROM pedidos INNER JOIN clientes ON clientes.id = pedidos.cliente_id WHERE pedidos.status = "CRIADO" AND pedidos.valor_total > 0';
  try {
    db.execute(selectQuery, (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar os pedidos.',
        });
        return false;
      }
      res.status(200).send({ pedidos: results });
    });
  } catch (error) {
    console.error('listAllPedidos', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os pedidos.' });
  }
};

// ==> Método que listará todos os pedidos para entregar amanhã
exports.listAllTomorrowPedidos = async (req, res) => {
  const dataEntrega = new Date().setDate(new Date() + 1);
  const selectQuery = 'SELECT pedidos.id AS id, pedidos.data_criacao AS dataCriacao, pedidos.valor_total AS valorTotal, clientes.nome AS nome, clientes.cidade AS cidade, clientes.estado AS estado FROM pedidos INNER JOIN clientes ON clientes.id = pedidos.cliente_id where pedidos.data_entrega = ?';
  try {
    setTimeout(() => {
      db.execute(selectQuery, [dataEntrega], (err, results) => {
        if (err) {
          res.status(500).send({
            developMessage: err.message,
            userMessage: 'Falha ao listar os pedidos.',
          });
          return false;
        }
        res.status(200).send({ pedidos: results });
      });
    }, 5000);
  } catch (error) {
    console.error('listAllTomorrowPedidos', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os pedidos.' });
  }
};

// ==> Método que listará um pedido específico
exports.listOnePedido = async (req, res) => {
  const { pedidoId } = req.params;
  try {
    db.execute('SELECT pedidos.id AS id, pedidos.data_criacao AS dataCriacao, pedidos.data_entrega AS dataEntrega, pedidos.valor_total AS valorTotal, pedidos.status as status, pedidos.observacao as observacao, pedidos.obsCancelamento as obsCancelamento, pedidos.is_finalizado as isFinalizado, clientes.nome AS nome, clientes.endereco AS endereco, clientes.cidade AS cidade, clientes.estado AS estado, clientes.telefone AS telefone FROM pedidos INNER JOIN clientes ON clientes.id = pedidos.cliente_id WHERE pedidos.id = ?', [pedidoId], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar o Pedido.',
        });
        return false;
      }
      res.status(200).send({ pedido: results });
    });
  } catch (error) {
    console.error('listOnePedido', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar o Pedido.' });
  }
};

// ==> Método que listará todos os pedidos
exports.listAllPedidosByCliente = async (req, res) => {
  const { clienteId } = req.body;
  try {
    db.execute('SELECT * FROM pedidos WHERE cliente_id = ?', [clienteId], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar os pedidos.',
        });
        return false;
      }
      res.status(200).send({ pedidos: results });
    });
  } catch (error) {
    console.error('listAllPedidos', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar os pedidos.' });
  }
};

// ==> Método que listará um pedido específico
exports.listOnePedidoByCliente = async (req, res) => {
  const { pedidoId, clienteId } = req.body;
  try {
    db.execute('SELECT * FROM pedidos WHERE clienteId = ? AND pedidoId = ?', [clienteId, pedidoId], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao listar o Pedido.',
        });
        return false;
      }
      res.status(200).send({ pedido: results });
    });
  } catch (error) {
    console.error('listOnePedido', error);
    res.status(500).send({ message: 'Ocorreu um erro ao listar o Pedido.' });
  }
};

exports.calculaValorTotal = async (req, res) => {
  const { pedidoId } = req.params;
  const selectQuery = 'SELECT SUM(preco_total) as totalPedido FROM item_pedido WHERE pedido_id = ?;';
  try {
    db.execute(selectQuery, [pedidoId], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao calcular o valor total do Pedido.',
        });
        return false;
      }

      res.status(200).send(results[0]);
    });
  } catch (error) {
    console.error('calculaValorTotal', error);
    res.status(500).send({ message: 'Ocorreu um erro ao calcular o valor total do Pedido.' });
  }
};

exports.recuperarProdutosNoPedido = async (req, res) => {
  const { pedidoId } = req.params;
  const selectQuery = `select item_pedido.id as itemPedidoId, produtos.id as produtoId, estante_produto.estante_id as estanteId, produtos.nome as nome, produtos.unidade_medida as unidade, preco_quantidade.preco_venda as precoVenda, item_pedido.quantidade as quantidade, item_pedido.preco_total as total from estante_produto
  inner join produtos on produtos.id = estante_produto.produto_id
  inner join preco_quantidade on preco_quantidade.id = estante_produto.preco_quantidade_id
  inner join item_pedido on item_pedido.produto_id = estante_produto.produto_id
  where item_pedido.pedido_id = ? and estante_produto.estante_id = item_pedido.estante_id;`;
  try {
    db.execute(selectQuery, [pedidoId], (err, results) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao calcular o valor total do Pedido.',
        });
        return false;
      }

      res.status(200).send({ produtos: results });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao calcular o valor total do Pedido.' });
  }
};

exports.recuperarUltimoPedidoByCliente = async (req, res) => {
  const { clienteId } = req.params;
  const selectQuery = 'SELECT pedidos.id AS id, pedidos.data_criacao AS dataCriacao, pedidos.data_entrega AS dataEntrega, pedidos.valor_total AS valorTotal, pedidos.status as status, pedidos.observacao as observacao, pedidos.obsCancelamento as obsCancelamento, clientes.nome AS nome, clientes.endereco AS endereco, clientes.cidade AS cidade, clientes.estado AS estado, clientes.telefone AS telefone FROM pedidos INNER JOIN clientes ON clientes.id = pedidos.cliente_id WHERE pedidos.id=(SELECT MAX(pedidos.id) FROM pedidos WHERE cliente_id = ?)';
  try {
    db.execute(selectQuery, [clienteId], (error, results) => {
      if (error) {
        res.status(500).send({
          developMessage: error.message,
          userMessage: 'Falha ao recuperar o último pedido desse Cliente.',
        });
        return false;
      }

      res.status(200).send({ pedido: results[0] });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao recuperar o último pedido desse Cliente.' });
  }
};

exports.recuperarPedidosByCliente = async (req, res) => {
  const { clienteId } = req.params;
  const mes = new Date().getMonth();
  let dataParaFiltro;
  if (mes >= 6) {
    dataParaFiltro = new Date('July, 1').setFullYear(new Date().getFullYear());
  } else {
    dataParaFiltro = new Date('January, 1').setFullYear(new Date().getFullYear());
  }
  const selectQuery = "SELECT pedidos.id AS id, pedidos.data_criacao AS dataCriacao, pedidos.data_entrega AS dataEntrega, pedidos.valor_total AS valorTotal, pedidos.status as status, pedidos.observacao as observacao, pedidos.obsCancelamento as obsCancelamento, pedidos.is_finalizado as isFinalizado, clientes.nome AS nome, clientes.endereco AS endereco, clientes.cidade AS cidade, clientes.estado AS estado, clientes.telefone AS telefone FROM pedidos INNER JOIN clientes ON clientes.id = pedidos.cliente_id WHERE pedidos.cliente_id = ? AND pedidos.data_criacao >= ? AND pedidos.status = 'CONFIRMADO' OR 'ENTREGUE'";
  try {
    db.execute(selectQuery, [clienteId, dataParaFiltro], (error, results) => {
      if (error) {
        res.status(500).send({
          developMessage: error.message,
          userMessage: 'Falha ao recuperar os pedidos desse Cliente.',
        });
        return false;
      }

      res.status(200).send({ pedidos: results });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao recuperar o último pedido desse Cliente.' });
  }
};

exports.ordersByClientReport = async (req, res) => {
  try {
    const { clienteId, dataInicial, dataFinal } = req.body;
    const selectQuery = `
      SELECT pedidos.id AS id, clientes.nome AS cliente, pedidos.data_criacao AS dataCriacao, pedidos.data_entrega AS dataEntrega, pedidos.valor_total AS total, pedidos.status as status
      FROM pedidos 
      INNER JOIN clientes ON clientes.id = pedidos.cliente_id
      WHERE pedidos.cliente_id = ?
      AND pedidos.data_entrega BETWEEN ? AND ?
      AND valor_total > 0
      AND pedidos.status != "CRIADO"
      AND pedidos.status != "CANCELADO";
    `;

    const [rows] = await dbPromise.execute(selectQuery, [clienteId, dataInicial, dataFinal]);

    await this.getProdutosDoPedido(rows, res);
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao recuperar os pedidos desse Cliente.' });
  }
};

exports.getProdutosDoPedido = async (pedidos, res, total) => {
  try {
    const selectQueryProdutosNoPedido = `select item_pedido.id as itemPedidoId, produtos.id as produtoId, produtos.nome as nome, produtos.unidade_medida as unidade, preco_quantidade.preco_venda as precoVenda, item_pedido.quantidade as quantidade, item_pedido.preco_total as total from estante_produto
    inner join produtos on produtos.id = estante_produto.produto_id
    inner join preco_quantidade on preco_quantidade.id = estante_produto.preco_quantidade_id
    inner join item_pedido on item_pedido.produto_id = estante_produto.produto_id
    where item_pedido.pedido_id = ? and estante_produto.estante_id = item_pedido.estante_id;`;

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i <= pedidos.length - 1; i++) {
      // eslint-disable-next-line no-await-in-loop
      const [rows] = await dbPromise.execute(selectQueryProdutosNoPedido, [pedidos[i].id]);

      if (rows) {
        pedidos[i].itens = rows;
      }

      if (i === pedidos.length - 1) {
        res.status(200).send({ vendas: pedidos, total });
      }
    }
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao recuperar os pedidos analíticos desse Cliente.' });
  }
};

exports.ordersBetweenDates = async (req, res) => {
  const { dataInicial, dataFinal } = req.params;
  const selectQuery = `SELECT pedidos.id AS id, clientes.nome AS cliente, pedidos.data_criacao AS dataCriacao, pedidos.status AS status, pedidos.data_entrega AS dataEntrega, pedidos.valor_total AS total 
  FROM pedidos 
  INNER JOIN clientes ON clientes.id = pedidos.cliente_id
  WHERE pedidos.data_entrega BETWEEN ? AND ?
  AND pedidos.status != "CRIADO"
  AND pedidos.status != "CANCELADO";`;

  try {
    const [rows] = await dbPromise.execute(selectQuery, [dataInicial, dataFinal]);

    const total = rows.reduce((acumulador, numero) => (acumulador += numero.total), 0);

    await this.getProdutosDoPedido(rows, res, total);
  } catch (error) {
    res.status(500).send({ message: `Ocorreu um erro ao recuperar os pedidos entre essas datas. (${dataInicial} a ${dataFinal})` });
  }
};

exports.atualizarDataEntrega = async (req, res) => {
  const { pedidoId, dataEntrega } = req.params;
  const patchQuery = 'UPDATE pedidos SET data_entrega = ? WHERE id = ?';

  try {
    db.execute(patchQuery, [Number(dataEntrega), pedidoId], (err, result) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao alterar a data de entrega para este pedido.',
        });
        return false;
      }

      res.status(200).send({ pedidoId, dataEntrega: format(new Date(Number(dataEntrega)), 'dd/MM/yyyy'), affectedRows: result.affectedRows });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar a data de entrega para este pedido.' });
  }
};

exports.atualizarValorTotal = async (req, res) => {
  const { pedidoId } = req.params;
  const { valorTotal } = req.body;

  const putQuery = valorTotal ? 'UPDATE pedidos SET valor_total = ? WHERE id = ?' : 'update pedidos set pedidos.valor_total = (select sum(item_pedido.preco_total) as total from item_pedido where item_pedido.pedido_id = ?) where id = ?';
  const paramsArray = valorTotal ? [Number(valorTotal), pedidoId] : [pedidoId, pedidoId];

  try {
    db.execute(putQuery, paramsArray, (err, result) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao atualizar o valor total deste pedido.',
        });
        return false;
      }

      res.status(200).send({
        message: 'Pedido fechado com o valor atualizado!', pedidoId, valorTotal, affectedRows: result.affectedRows,
      });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar o valor total deste pedido.' });
  }
};

exports.atualizarValorTotalSemSend = async (req, res) => {
  const { pedidoId } = req.params;
  const { valorTotal } = req.body;

  const putQuery = valorTotal ? 'UPDATE pedidos SET valor_total = ? WHERE id = ?' : 'update pedidos set pedidos.valor_total = (select sum(item_pedido.preco_total) as total from item_pedido where item_pedido.pedido_id = ?) where id = ?';
  const paramsArray = valorTotal ? [Number(valorTotal), pedidoId] : [pedidoId, pedidoId];

  try {
    db.execute(putQuery, paramsArray, (err, result) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao atualizar o valor total deste pedido.',
        });
        return false;
      }
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar o valor total deste pedido.' });
  }
};

exports.recuperarValorTotal = async (req, res) => {
  const { pedidoId } = req.params;

  const selectQuery = `SELECT pedidos.valor_total FROM pedidos WHERE pedidos.id = ${pedidoId};`;

  await this.atualizarValorTotalSemSend(req, res);

  try {
    db.query(selectQuery, (err, result) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao recuperar o valor total deste pedido.',
        });
        return false;
      }

      res.status(200).send({
        message: 'Valor total do pedido recuperado com sucesso!', pedidoId, valorTotal: result[0].valor_total,
      });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar o valor total deste pedido.' });
  }
};

exports.setarPedidoComoEntregue = async (req, res) => {
  const { pedidoId } = req.params;

  const patchQuery = "UPDATE pedidos SET entregue = 1, status = 'ENTREGUE' WHERE id = ?;";

  try {
    db.execute(patchQuery, [pedidoId], (err, result) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao atualizar pedido para status de Entregue.',
        });
        return false;
      }

      res.status(200).send({ message: 'Pedido entregue com sucesso!', pedidoId, affectedRows: result.affectedRows });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar pedido para status de Entregue.' });
  }
};

exports.setarEmpresaAoPedido = async (req, res) => {
  const { pedidoId, idEmpresa } = req.params;

  const patchQuery = 'UPDATE pedidos SET empresa = ? WHERE pedidos.id = ?;';

  try {
    db.execute(patchQuery, [idEmpresa, pedidoId], (err, result) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao setar empresa ao pedido.',
        });
        return false;
      }

      res.status(200).send({ message: 'Empresa cadastrada ao pedido com sucesso!', pedidoId, affectedRows: result.affectedRows });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao atualizar empresa do pedido.' });
  }
};

exports.finalizarPedido = async (req, res) => {
  const { pedidoId } = req.params;

  const patchQuery = 'UPDATE pedidos SET is_finalizado = 1 WHERE pedidos.id = ?;';

  try {
    db.execute(patchQuery, [pedidoId], (err, result) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: 'Falha ao finalizar o pedido.',
        });
        return false;
      }

      res.status(200).send({ message: 'Pedido finalizado com sucesso!', pedidoId, affectedRows: result.affectedRows });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao finalizar o pedido.' });
  }
};

exports.recuperarPrecoVendaProduto = async (req, res) => {
  const { estanteId, produtoId } = req.params;

  const selectPrecoVenda = 'SELECT preco_venda FROM preco_quantidade WHERE id = (SELECT preco_quantidade_id FROM estante_produto WHERE estante_id = ? AND produto_id = ?)';

  try {
    db.execute(selectPrecoVenda, [estanteId, produtoId], (err, result) => {
      if (err) {
        res.status(500).send({
          developMessage: err.message,
          userMessage: `Falha ao recuperar o preço de venda do Produto ${produtoId}`,
        });
        return false;
      }

      res.status(200).send({
        message: 'Preço de venda recuperado com sucesso!',
        precoVenda: result[0].preco_venda,
      });
    });
  } catch (error) {
    res.status(500).send({ message: 'Ocorreu um erro ao recuperar o preço de venda.' });
  }
};
