-- Inserir produto inicial
INSERT INTO `products` (`id`, `name`, `description`, `active`) VALUES (1, 'Proxy iOS', 'Proxy de alta velocidade para dispositivos iOS', 1);

-- Inserir variantes (planos)
INSERT INTO `product_variants` (`id`, `product_id`, `name`, `days`, `price`, `active`) VALUES 
(1, 1, '1 Dia', 1, 5.00, 1),
(2, 1, '7 Dias', 7, 10.00, 1),
(3, 1, '30 Dias', 30, 15.00, 1);

-- Inserir keys de teste para estoque
INSERT INTO `keys_stock` (`variant_id`, `key_value`, `used`) VALUES 
(1, 'TEST-1DAY-KEY-001', 0),
(1, 'TEST-1DAY-KEY-002', 0),
(2, 'TEST-7DAYS-KEY-001', 0),
(2, 'TEST-7DAYS-KEY-002', 0),
(3, 'TEST-30DAYS-KEY-001', 0),
(3, 'TEST-30DAYS-KEY-002', 0);
