# Proxy Revendedores - Deploy na Railway

## 📦 O que está incluído

Este é o código-fonte completo do site **Proxy Revendedores** com:

- ✅ Frontend React 19 + Tailwind CSS 4 (Dark/Cyberpunk)
- ✅ Backend Express + tRPC com autenticação local (usuário/senha)
- ✅ Banco de dados MySQL com Drizzle ORM
- ✅ Integração PIX via MisticPay
- ✅ Painel administrativo com gerenciamento de estoque
- ✅ Sistema de compra automatizado com liberação de keys
- ✅ Responsividade mobile completa
- ✅ Testes automatizados (Vitest)

## 🚀 Quick Start para Railway

### 1. Clonar/Extrair o Repositório

```bash
# Se recebeu como ZIP
unzip proxy-revendedores-source.zip
cd proxy-revendedores

# Ou clone do GitHub (se já fez push)
git clone seu-repositorio
cd proxy-revendedores
```

### 2. Instalar Dependências Localmente

```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=gere-um-secret-aleatorio-forte
MISTICPAY_CLIENT_ID=ci_yly5ydonmngjdf6
MISTICPAY_CLIENT_SECRET=cs_egyu31ia5s27cqmbyv1a59mv2
NODE_ENV=production
```

### 4. Executar Migrations do Banco de Dados

```bash
pnpm drizzle-kit migrate
```

### 5. Build e Teste Local

```bash
# Build
pnpm build

# Iniciar servidor
pnpm start
```

Acesse `http://localhost:3000`

### 6. Deploy na Railway

#### Opção A: Via GitHub (Recomendado)

1. Faça push para GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin seu-repositorio-github
git push -u origin main
```

2. Na Railway:
   - Clique em "New Project"
   - Selecione "Deploy from GitHub"
   - Conecte seu repositório
   - Railway detectará automaticamente como Node.js

#### Opção B: Via Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### 7. Configurar Variáveis na Railway

No painel da Railway:

1. Vá para **Settings** → **Variables**
2. Adicione todas as variáveis do `.env.local`
3. Salve

### 8. Configurar Banco de Dados

**Opção A: Usar MySQL Externo** (PlanetScale, AWS RDS, etc)
- Obtenha a `DATABASE_URL`
- Adicione nas variáveis da Railway

**Opção B: Usar MySQL na Railway**
- Clique em "Add Service"
- Selecione "MySQL"
- Railway criará a `DATABASE_URL` automaticamente

### 9. Executar Migrations na Railway

```bash
# Via Railway CLI
railway run "pnpm drizzle-kit migrate"

# Ou via console da Railway
pnpm drizzle-kit migrate
```

## 📋 Estrutura do Projeto

```
proxy-revendedores/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Home, Shop, Checkout, etc)
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # Contextos (Auth, Theme)
│   │   └── index.css      # Estilos globais (Dark/Cyberpunk)
│   └── index.html
├── server/                 # Backend Express + tRPC
│   ├── routers.ts         # Rotas e lógica de negócio
│   ├── db.ts              # Helpers de banco de dados
│   └── _core/             # Infraestrutura (OAuth, tRPC, etc)
├── drizzle/               # Schema e migrations
│   ├── schema.ts          # Definição das tabelas
│   └── migrations/        # SQL migrations
├── shared/                # Código compartilhado
├── package.json           # Dependências
├── vite.config.ts         # Config do Vite
├── tsconfig.json          # Config do TypeScript
└── vitest.config.ts       # Config dos testes
```

## 🔑 Credenciais Padrão

### Admin
- **Usuário:** `ADMIN`
- **Senha:** `ADMIN999`

### Cliente de Teste
- **Usuário:** `RUANFF`
- **Senha:** `BRAVO234`

## 🌐 Rotas Principais

| Rota | Descrição |
|------|-----------|
| `/` | Home/Landing page |
| `/shop` | Loja de produtos |
| `/checkout` | Checkout com PIX |
| `/my-purchases` | Minhas compras (cliente) |
| `/login` | Login |
| `/register` | Cadastro |
| `/admin` | Painel administrativo |

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, Tailwind CSS 4, Shadcn/UI
- **Backend:** Express 4, tRPC 11, Node.js
- **Database:** MySQL, Drizzle ORM
- **Auth:** JWT local (sem OAuth)
- **Pagamento:** MisticPay API (PIX)
- **Build:** Vite, esbuild
- **Testes:** Vitest
- **Package Manager:** pnpm

## 📝 Variáveis de Ambiente Necessárias

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ | String de conexão MySQL |
| `JWT_SECRET` | ✅ | Secret para assinar tokens JWT |
| `MISTICPAY_CLIENT_ID` | ✅ | ID do cliente MisticPay |
| `MISTICPAY_CLIENT_SECRET` | ✅ | Secret do cliente MisticPay |
| `NODE_ENV` | ✅ | Deve ser `production` |
| `PORT` | ❌ | Railway define automaticamente |

## 🧪 Testes

```bash
# Rodar testes
pnpm test

# Rodar testes com coverage
pnpm test -- --coverage
```

## 📊 Monitoramento na Railway

1. **Logs:** Vá para **Logs** para ver logs do servidor
2. **Metrics:** Monitore CPU, memória e requisições
3. **Alerts:** Configure alertas para erros

## 🔒 Segurança

- Senhas são hasheadas com bcryptjs
- Tokens JWT com expiração de 7 dias
- HTTPS automático na Railway
- Variáveis sensíveis protegidas

## 🐛 Troubleshooting

### "Cannot find module"
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "Database connection failed"
- Verifique se `DATABASE_URL` está correta
- Teste a conexão localmente
- Verifique firewall/whitelist de IP

### "Build fails"
- Verifique se todas as variáveis estão configuradas
- Veja os logs da Railway para detalhes

## 📞 Suporte

- Documentação Railway: https://docs.railway.app
- Documentação tRPC: https://trpc.io
- Documentação Drizzle: https://orm.drizzle.team

## 📄 Licença

Propriedade do desenvolvedor. Todos os direitos reservados.

---

**Versão:** 1.0.0  
**Data:** Junho 2026  
**Status:** Pronto para produção
