-- Aumenta precisão de quantidade de 4 para 6 casas decimais.
-- Rode se a migration 002 já foi aplicada com DECIMAL(20,4).

ALTER TABLE preco_quantidade
  MODIFY quantidade DECIMAL(20,6) NOT NULL;

ALTER TABLE item_pedido
  MODIFY quantidade DECIMAL(20,6) NOT NULL;
