# Migrations — banco remoto / conexão instável

O arquivo `001_add_preco_unitario.sql` atualiza **todos** os registros de uma vez. Em bancos grandes ou com latência alta (ex.: hospedado nos EUA), a conexão pode cair antes de terminar.

## Opção recomendada: script em lotes (retomável)

Na pasta `jubo-api`, com o `.env` apontando para produção:

```bash
node scripts/migrate-preco-unitario.js
```

- Processa **20.000 registros por vez** (ajuste com `--batch-size=50000` se a conexão aguentar).
- Se a conexão cair, **rode o mesmo comando de novo** — ele continua só nas linhas pendentes.
- Teste antes sem alterar nada: `node scripts/migrate-preco-unitario.js --dry-run`

## Opção 2: SQL manual em etapas

Execute **um comando por vez** no cliente SQL (Workbench, DBeaver, etc.), esperando cada um terminar:

### Etapa A — só estrutura (rápido)

```sql
ALTER TABLE item_pedido
  ADD COLUMN preco_unitario DOUBLE NULL AFTER quantidade;
```

Se a coluna já existir, pule esta etapa.

### Etapa B — preencher preço unitário (repita até afetar 0 linhas)

```sql
UPDATE item_pedido
SET preco_unitario = preco_total / quantidade
WHERE quantidade > 0 AND (preco_unitario IS NULL OR preco_unitario = 0)
LIMIT 20000;
```

### Etapa C — NOT NULL (só quando não houver NULL)

```sql
ALTER TABLE item_pedido MODIFY preco_unitario DOUBLE NOT NULL;
```

### Etapa D — recalcular totais dos itens (repita até 0 linhas)

```sql
UPDATE item_pedido
SET preco_total = ROUND(preco_unitario * quantidade, 2)
WHERE quantidade > 0
  AND ABS(preco_total - ROUND(preco_unitario * quantidade, 2)) > 0.001
LIMIT 20000;
```

### Etapa E — recalcular pedidos (por faixa de ID)

Descubra o maior ID: `SELECT MAX(id) FROM pedidos;`

Depois, em blocos (ex.: 1–500, 501–1000, …):

```sql
UPDATE pedidos p
SET valor_total = (
  SELECT COALESCE(SUM(ROUND(ip.preco_unitario * ip.quantidade, 2)), 0)
  FROM item_pedido ip
  WHERE ip.pedido_id = p.id
)
WHERE p.id BETWEEN 1 AND 500;
```

## Opção 3: rodar perto do banco

Se o provedor for AWS/GCP/Azure:

- Use **Cloud Shell** ou uma VM na **mesma região** do banco.
- Clone o repo, configure `.env` e rode o script Node lá.
- Latência baixa = menos queda de conexão.

## Antes de começar

1. **Backup** do banco (snapshot do provedor ou `mysqldump`).
2. Confirme que a API nova **só sobe depois** da coluna `preco_unitario` existir.
3. Em horário de pouco uso, se possível.

## Conferir se terminou

```sql
SELECT COUNT(*) FROM item_pedido WHERE preco_unitario IS NULL;
-- deve ser 0

SELECT COUNT(*) FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'item_pedido'
  AND COLUMN_NAME = 'preco_unitario'
  AND IS_NULLABLE = 'NO';
-- deve ser 1
```
