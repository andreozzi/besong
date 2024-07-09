const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const https = require('https');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();


// Middleware para permitir CORS
app.use(cors());

// Configuração do banco de dados usando createPool do mysql2
const pool = mysql.createPool({
  connectionLimit: 10,
  host: "34.224.8.247",    // Host do seu banco de dados MySQL
  port: 3306,               // Porta do seu banco de dados MySQL
  user: "root",             // Usuário do seu banco de dados MySQL
  password: "1234",         // Senha do seu banco de dados MySQL
  database: "beSongDB",     // Nome do banco de dados
  multipleStatements: true
});

// Middleware para parse de JSON
app.use(express.json());

const SECRET_KEY = 'token';

const vercelProtectionBypassSecret = 'gjAq5Q0OZrih26g7qHiio5lu4y8gCzqT';

// Rota para login de usuários
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Montar query SQL para buscar o usuário pelo email
    const sql = 'SELECT * FROM ARTISTA WHERE email = ?';
    pool.query(sql, [email], async (err, results) => {
      if (err) {
        console.error('Erro ao executar a query: ' + err.stack);
        res.setHeader('x-vercel-protection-bypass', vercelProtectionBypassSecret);
        res.status(500).json({ error: 'Erro interno ao buscar no banco de dados' });
        return;
      }

      if (results.length === 0) {
        res.setHeader('x-vercel-protection-bypass', vercelProtectionBypassSecret);
        res.status(401).json({ error: 'Usuário não encontrado' });
        return;
      }

      const user = results[0];
      console.log(user);

      // Comparar a senha fornecida com a senha armazenada
      const match = await bcrypt.compare(senha, user.senha);
      if (!match) {
        res.setHeader('x-vercel-protection-bypass', vercelProtectionBypassSecret);
        res.status(401).json({ error: 'Senha incorreta' });
        return;
      }

      const token = jwt.sign({ id: user.idArtista, nome: user.nomeArtistico, eBanda: user.eBanda, genero: user.generoMusical, regiao: user.regiao, ytLink: user.ytLink, wppLink: user.wppLink, insta: user.instaLink, spotfy: user.spotfyLink,email: user.email, user: user.usuario, telefone: user.telefone, descricao:user.descricao }, SECRET_KEY, { expiresIn: '1h' });

      // Login bem-sucedido
      res.setHeader('x-vercel-protection-bypass', vercelProtectionBypassSecret);
      res.json({ message: 'Login efetuado com sucesso', token });
    });
  } catch (err) {
    console.error('Erro ao verificar a senha: ' + err.stack);
    res.setHeader('x-vercel-protection-bypass', vercelProtectionBypassSecret);
    res.status(500).json({ error: 'Erro interno ao processar a senha' });
  }
});

// Caminho para os arquivos SSL
const sslPath = path.join(__dirname, '..', 'https');
const keyPath = path.join(sslPath, 'key.pem');
const certPath = path.join(sslPath, 'cert.pem');

const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
 };

const httpsServer = https.createServer(httpsOptions, app);

httpsServer.listen(3446, () => {
    console.log('Servidor HTTPS rodando na porta 3446');
})

// Iniciar o servidor na porta 85
const PORT = process.env.PORT || 85;
app.listen(PORT, () => {
  console.log(`Servidor está rodando na porta ${PORT}`);
});
