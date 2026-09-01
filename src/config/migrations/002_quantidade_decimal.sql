-- Permite quantidades fracionárias (ex.: 2,5 kg) em pedidos e estoque.
-- DECIMAL(20,6): suporta valores legados de INT e decimais no pedido (ex.: 2,5 kg).

ALTER TABLE preco_quantidade
  MODIFY quantidade DECIMAL(20,6) NOT NULL;

ALTER TABLE item_pedido
  MODIFY quantidade DECIMAL(20,6) NOT NULL;