# Guia de Deploy - Proxy Revendedores na Railway

## Pré-requisitos

1. Conta na Railway (https://railway.app)
2. Git instalado
3. Node.js 22+ instalado localmente

## Passo 1: Preparar o Repositório

```bash
# Extrair o arquivo ZIP
unzip proxy-revendedores-source.zip -d proxy-revendedores
cd proxy-revendedores

# Inicializar repositório Git
git init
git add .
git commit -m "Initial commit - Proxy Revendedores"
```

## Passo 2: Criar Projeto na Railway

1. Acesse https://railway.app
2. Clique em "New Project"
3. Selecione "Deploy from GitHub" ou "Deploy from Git"
4. Conecte seu repositório GitHub

## Passo 3: Configurar Variáveis de Ambiente

Na Railway, vá para **Settings** → **Variables** e adicione:

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=seu-jwt-secret-aleatorio
MISTICPAY_CLIENT_ID=ci_yly5ydonmngjdf6
MISTICPAY_CLIENT_SECRET=cs_egyu31ia5s27cqmbyv1a59mv2
VITE_APP_TITLE=Proxy Revendedores
VITE_APP_LOGO=https://seu-logo-url.png
NODE_ENV=production
```

## Passo 4: Configurar Build e Start

Railway deve detectar automaticamente que é um projeto Node.js. Se não:

1. Vá para **Settings** → **Build**
2. Build Command: `pnpm install && pnpm build`
3. Start Command: `pnpm start`

## Passo 5: Configurar Banco de Dados

### Opção A: MySQL Externo (Recomendado)

1. Use um serviço como PlanetScale, AWS RDS ou DigitalOcean
2. Obtenha a string de conexão
3. Adicione como `DATABASE_URL` nas variáveis de ambiente

### Opção B: MySQL na Railway

1. Na Railway, clique em "Add Service"
2. Selecione "MySQL"
3. Configure as credenciais
4. A `DATABASE_URL` será gerada automaticamente

## Passo 6: Executar Migrations

Após o primeiro deploy:

```bash
# Localmente, com a DATABASE_URL do Railway
DATABASE_URL="mysql://..." pnpm drizzle-kit migrate
```

Ou via Railway CLI:

```bash
railway run "pnpm drizzle-kit migrate"
```

## Passo 7: Deploy

1. Faça push para o repositório GitHub
2. Railway detectará automaticamente e iniciará o deploy
3. Acompanhe o progresso em **Deployments**

## Estrutura do Projeto

```
proxy-revendedores/
├── client/              # Frontend React + Tailwind
├── server/              # Backend Express + tRPC
├── drizzle/             # Schema e migrations do banco
├── shared/              # Código compartilhado
├── package.json         # Dependências
├── vite.config.ts       # Config do Vite
├── tsconfig.json        # Config do TypeScript
└── .env.example         # Exemplo de variáveis
```

## Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| DATABASE_URL | String de conexão MySQL | mysql://user:pass@host/db |
| JWT_SECRET | Secret para assinar tokens | seu-secret-aleatorio |
| MISTICPAY_CLIENT_ID | ID do cliente MisticPay | ci_yly5ydonmngjdf6 |
| MISTICPAY_CLIENT_SECRET | Secret do cliente MisticPay | cs_egyu31ia5s27cqmbyv1a59mv2 |
| NODE_ENV | Ambiente | production |

## Troubleshooting

### Build falha com "Cannot find module"

```bash
# Limpar cache e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Banco de dados não conecta

1. Verifique se a `DATABASE_URL` está correta
2. Teste a conexão localmente
3. Verifique se o firewall permite conexões

### Porta não está respondendo

Railway usa a porta definida em `process.env.PORT`. O servidor já está configurado para isso.

## Monitoramento

1. Acesse **Logs** na Railway para ver logs do servidor
2. Use **Metrics** para monitorar CPU, memória e requisições
3. Configure **Alerts** para notificações

## Próximas Etapas

1. Configurar domínio customizado
2. Ativar HTTPS automático (Railway faz isso)
3. Configurar backups automáticos do banco de dados
4. Monitorar performance e custos

## Suporte

Para problemas com Railway, consulte: https://docs.railway.app
