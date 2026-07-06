import mysql from 'mysql2/promise';

async function clearStock() {
  const connection = await mysql.createConnection("mysql://root:mJdoIBzqADUVdLgXdpIZckLoDCQlvaGt@hayabusa.proxy.rlwy.net:57252/railway");
  
  console.log("Conectado ao banco!");

  try {
    // Limpar estoque
    const [result] = await connection.execute("DELETE FROM `keys_stock`");
    console.log(`Estoque limpo com sucesso! ${result.affectedRows} keys removidas.`);
  } catch (err) {
    console.error("Erro ao limpar estoque:", err);
  } finally {
    await connection.end();
  }
}

clearStock();
