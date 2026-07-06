import mysql from 'mysql2/promise';

async function seed() {
  const connection = await mysql.createConnection("mysql://root:mJdoIBzqADUVdLgXdpIZckLoDCQlvaGt@hayabusa.proxy.rlwy.net:57252/railway");
  
  console.log("Conectado ao banco!");

  try {
    // Inserir produto
    await connection.execute("INSERT IGNORE INTO `products` (`id`, `name`, `description`, `active`) VALUES (1, 'Proxy iOS', 'Proxy de alta velocidade para dispositivos iOS', 1)");
    
    // Inserir variantes
    await connection.execute("INSERT IGNORE INTO `product_variants` (`id`, `product_id`, `name`, `days`, `price`, `active`) VALUES (1, 1, '1 Dia', 1, 5.00, 1)");
    await connection.execute("INSERT IGNORE INTO `product_variants` (`id`, `product_id`, `name`, `days`, `price`, `active`) VALUES (2, 1, '7 Dias', 7, 10.00, 1)");
    await connection.execute("INSERT IGNORE INTO `product_variants` (`id`, `product_id`, `name`, `days`, `price`, `active`) VALUES (3, 1, '30 Dias', 30, 15.00, 1)");

    // Inserir keys de teste
    await connection.execute("INSERT IGNORE INTO `keys_stock` (`variant_id`, `key_value`, `used`) VALUES (1, 'TEST-1DAY-KEY-001', 0)");
    await connection.execute("INSERT IGNORE INTO `keys_stock` (`variant_id`, `key_value`, `used`) VALUES (1, 'TEST-1DAY-KEY-002', 0)");
    await connection.execute("INSERT IGNORE INTO `keys_stock` (`variant_id`, `key_value`, `used`) VALUES (2, 'TEST-7DAYS-KEY-001', 0)");
    await connection.execute("INSERT IGNORE INTO `keys_stock` (`variant_id`, `key_value`, `used`) VALUES (2, 'TEST-7DAYS-KEY-002', 0)");
    await connection.execute("INSERT IGNORE INTO `keys_stock` (`variant_id`, `key_value`, `used`) VALUES (3, 'TEST-30DAYS-KEY-001', 0)");
    await connection.execute("INSERT IGNORE INTO `keys_stock` (`variant_id`, `key_value`, `used`) VALUES (3, 'TEST-30DAYS-KEY-002', 0)");

    console.log("Seed finalizado com sucesso!");
  } catch (err) {
    console.error("Erro no seed:", err);
  } finally {
    await connection.end();
  }
}

seed();
