/**
 * Migration em lotes: adiciona preco_unitario e recalcula totais.
 *
 * Uso (na pasta jubo-api, com .env apontando para o banco):
 *   node scripts/migrate-preco-unitario.js
 *
 * Opções:
 *   --batch-size=20000   registros por lote (padrão: 20000)
 *   --dry-run            só mostra o que faria
 *
 * A conexão pode cair no meio — basta rodar de novo; o script retoma
 * de onde parou (só atualiza linhas ainda pendentes).
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DEFAULT_BATCH = 20000;
const MAX_BATCH = 100000;

const BATCH_SIZE = Number(process.argv.find((a) => a.startsWith('--batch-size='))?.split('=')[1]) || DEFAULT_BATCH;
const DRY_RUN = process.argv.includes('--dry-run');

function safeLimit(n) {
  const limit = Math.floor(Number(n));
  if (!Number.isFinite(limit) || limit <= 0 || limit > MAX_BATCH) {
    throw new Error(`LIMIT inválido: ${n} (máximo: ${MAX_BATCH})`);
  }
  return limit;
}

const LIMIT = safeLimit(BATCH_SIZE);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 3306,
  connectionLimit: 2,
  connectTimeout: 120000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function exec(sql, params = []) {
  if (DRY_RUN) {
    console.log('[dry-run]', sql.slice(0, 160).replace(/\s+/g, ' '), params.length ? `(${params.length} params)` : '');
    return { affectedRows: 0 };
  }
  const [result] = params.length
    ? await pool.execute(sql, params)
    : await pool.query(sql);
  return result;
}

async function colunaExiste(nomeColuna) {
  const rows = await query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'item_pedido' AND COLUMN_NAME = ?`,
    [process.env.MYSQL_DATABASE, nomeColuna],
  );
  return rows[0].cnt > 0;
}

async function aumentarTimeouts(conn) {
  await conn.query('SET SESSION wait_timeout = 28800');
  await conn.query('SET SESSION net_read_timeout = 600');
  await conn.query('SET SESSION net_write_timeout = 600');
}

async function executarLotes(sql, logLabel, pendentesInicial) {
  let total = 0;

  const processarProximoLote = async () => {
    const result = await exec(sql);
    const afetados = result.affectedRows || 0;
    if (afetados === 0) return total;

    total += afetados;
    console.log(`  ${logLabel}: +${afetados} linhas (${total} / ${pendentesInicial})`);
    return processarProximoLote();
  };

  return processarProximoLote();
}

function criarFaixasIds(minId, maxId, tamanhoFaixa) {
  const faixas = [];
  for (let inicio = minId; inicio <= maxId; inicio += tamanhoFaixa) {
    faixas.push({
      inicio,
      fim: Math.min(inicio + tamanhoFaixa - 1, maxId),
    });
  }
  return faixas;
}

async function fase1AdicionarColuna() {
  if (await colunaExiste('preco_unitario')) {
    console.log('✓ Coluna preco_unitario já existe — pulando ALTER TABLE');
    return;
  }

  console.log('→ Adicionando coluna preco_unitario...');
  await exec('ALTER TABLE item_pedido ADD COLUMN preco_unitario DOUBLE NULL AFTER quantidade');
  console.log('✓ Coluna criada');
}

async function fase2PreencherPrecoUnitario() {
  const [{ cnt: pendentesInicial }] = await query(
    'SELECT COUNT(*) AS cnt FROM item_pedido WHERE quantidade > 0 AND preco_unitario IS NULL',
  );
  console.log(`→ Preenchendo preco_unitario (${pendentesInicial} linhas pendentes)...`);

  const total = await executarLotes(
    `UPDATE item_pedido
     SET preco_unitario = preco_total / quantidade
     WHERE quantidade > 0 AND preco_unitario IS NULL
     ORDER BY id
     LIMIT ${LIMIT}`,
    'preco_unitario',
    pendentesInicial,
  );

  await exec(
    `UPDATE item_pedido
     SET preco_unitario = 0
     WHERE quantidade = 0 AND preco_unitario IS NULL`,
  );

  console.log(`✓ preco_unitario preenchido (${total} linhas com quantidade > 0)`);
}

async function fase3TornarNotNull() {
  const rows = await query('SELECT COUNT(*) AS cnt FROM item_pedido WHERE preco_unitario IS NULL');

  if (Number(rows[0].cnt) > 0) {
    console.warn(`⚠ Ainda há ${rows[0].cnt} linhas com preco_unitario NULL — rode o script de novo`);
    return;
  }

  const col = await query(
    `SELECT IS_NULLABLE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'item_pedido' AND COLUMN_NAME = 'preco_unitario'`,
    [process.env.MYSQL_DATABASE],
  );

  if (col[0]?.IS_NULLABLE === 'NO') {
    console.log('✓ Coluna já é NOT NULL — pulando');
    return;
  }

  console.log('→ Aplicando NOT NULL em preco_unitario...');
  await exec('ALTER TABLE item_pedido MODIFY preco_unitario DOUBLE NOT NULL');
  console.log('✓ NOT NULL aplicado');
}

async function fase4RecalcularPrecoTotal() {
  const [{ cnt: pendentesInicial }] = await query(
    `SELECT COUNT(*) AS cnt FROM item_pedido
     WHERE quantidade > 0
       AND ABS(preco_total - ROUND(preco_unitario * quantidade, 2)) > 0.001`,
  );
  console.log(`→ Recalculando preco_total (${pendentesInicial} linhas pendentes)...`);

  const total = await executarLotes(
    `UPDATE item_pedido
     SET preco_total = ROUND(preco_unitario * quantidade, 2)
     WHERE quantidade > 0
       AND ABS(preco_total - ROUND(preco_unitario * quantidade, 2)) > 0.001
     ORDER BY id
     LIMIT ${LIMIT}`,
    'preco_total',
    pendentesInicial,
  );

  console.log(`✓ preco_total recalculado (${total} linhas ajustadas)`);
}

async function atualizarFaixaPedidos(faixas, indice, totalAtual) {
  if (indice >= faixas.length) return totalAtual;

  const { inicio, fim } = faixas[indice];
  const result = await exec(
    `UPDATE pedidos p
     SET valor_total = (
       SELECT COALESCE(SUM(ROUND(ip.preco_unitario * ip.quantidade, 2)), 0)
       FROM item_pedido ip
       WHERE ip.pedido_id = p.id
     )
     WHERE p.id BETWEEN ${Math.floor(inicio)} AND ${Math.floor(fim)}`,
  );

  const afetados = result.affectedRows || 0;
  const total = totalAtual + afetados;
  console.log(`  pedidos ${inicio}–${fim}: ${afetados} atualizados (faixa ${indice + 1}/${faixas.length})`);

  return atualizarFaixaPedidos(faixas, indice + 1, total);
}

async function fase5RecalcularValorTotalPedidos() {
  const [{ minId, maxId }] = await query(
    'SELECT COALESCE(MIN(id), 0) AS minId, COALESCE(MAX(id), 0) AS maxId FROM pedidos',
  );

  if (minId === 0 && maxId === 0) {
    console.log('✓ Nenhum pedido para atualizar');
    return;
  }

  const faixa = LIMIT * 5;
  const faixas = criarFaixasIds(minId, maxId, faixa);

  console.log(`→ Recalculando valor_total dos pedidos (IDs ${minId}–${maxId}, faixas de ${faixa})...`);

  const total = await atualizarFaixaPedidos(faixas, 0, 0);
  console.log(`✓ valor_total dos pedidos recalculado (${total} pedidos)`);
}

async function main() {
  console.log('Migration preco_unitario (lotes de', `${LIMIT})`);
  if (DRY_RUN) console.log('MODO DRY-RUN — nenhuma alteração será feita\n');

  const conn = await pool.getConnection();
  try {
    await aumentarTimeouts(conn);
  } finally {
    conn.release();
  }

  const inicio = Date.now();

  await fase1AdicionarColuna();
  await fase2PreencherPrecoUnitario();
  await fase3TornarNotNull();
  await fase4RecalcularPrecoTotal();
  await fase5RecalcularValorTotalPedidos();

  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`\nConcluído em ${segundos}s`);
}

main()
  .catch((err) => {
    console.error('\nErro (pode rodar o script de novo para retomar):', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
