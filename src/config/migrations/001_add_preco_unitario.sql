-- Snapshot do preço unitário no momento do pedido.
--
-- ATENÇÃO: em bancos grandes ou conexão lenta (ex.: DB nos EUA),
-- este script único pode derrubar a conexão. Use em vez disso:
--   npm run migrate:preco-unitario
-- ou siga jubo-api/src/config/migrations/README.md

ALTER TABLE item_pedido
  ADD COLUMN preco_unitario DOUBLE NULL AFTER quantidade;
