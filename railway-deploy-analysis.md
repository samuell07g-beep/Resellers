# Análise e Guia de Deploy - Proxy Revendedores (Railway)

Após analisar o código-fonte do seu projeto "Proxy Revendedores", identifiquei todas as configurações necessárias para realizar o deploy com sucesso na Railway. O projeto é uma aplicação full-stack (React no frontend com Vite e Express/tRPC no backend) que utiliza MySQL com Drizzle ORM.

## Comandos de Build e Start

A Railway detecta automaticamente projetos Node.js através do `package.json`, mas para garantir que tudo funcione perfeitamente, você deve configurar os seguintes comandos na aba **Settings > Build** do seu projeto na Railway:

- **Custom Build Command:** `pnpm install && pnpm build`
- **Custom Start Command:** `pnpm start`

> **Nota:** O projeto utiliza `pnpm` como gerenciador de pacotes, o que é suportado nativamente pela Railway. O comando de build já está configurado no seu `package.json` para compilar tanto o frontend (Vite) quanto o backend (esbuild).

## Variáveis de Ambiente Necessárias

Na Railway, vá para **Settings > Variables** e adicione as seguintes variáveis de ambiente:

| Variável | Obrigatoriedade | Descrição |
|----------|----------------|-----------|
| `NODE_ENV` | **Obrigatório** | Deve ser definido como `production`. Isso garante que o servidor sirva os arquivos estáticos do frontend corretamente. |
| `DATABASE_URL` | **Obrigatório** | String de conexão com o banco de dados MySQL. Exemplo: `mysql://user:pass@host/db`. Você pode criar um banco de dados diretamente na Railway (Add Service > MySQL) e ele preencherá essa variável automaticamente. |
| `JWT_SECRET` | **Obrigatório** | Uma string aleatória usada para assinar os tokens de autenticação. Crie uma senha forte e segura. |
| `MISTICPAY_CLIENT_ID` | **Obrigatório** | Suas credenciais da API MisticPay para processamento de pagamentos. |
| `MISTICPAY_CLIENT_SECRET` | **Obrigatório** | O secret correspondente da API MisticPay. |

### Variáveis Opcionais (Se aplicável)
* `VITE_APP_TITLE`: Título da aplicação (ex: Proxy Revendedores).
* `VITE_APP_LOGO`: URL para o logo da sua aplicação.

> **Importante sobre a PORTA:** Não é necessário configurar a variável `PORT`. A Railway injeta automaticamente a variável `PORT` no ambiente e seu código (`server/_core/index.ts`) já está preparado para ler `process.env.PORT` e iniciar o servidor na porta correta.

## Banco de Dados e Migrations

Como o projeto usa Drizzle ORM, você precisará aplicar as migrações (criar as tabelas) no banco de dados após o primeiro deploy.

1. Se você criar o MySQL dentro da própria Railway, a variável `DATABASE_URL` será injetada automaticamente no seu serviço Node.js.
2. Após o deploy ser concluído com sucesso, você precisa rodar as migrations. Você pode fazer isso de duas formas:
   - **Localmente:** Configurando a `DATABASE_URL` da Railway no seu `.env` local e rodando `pnpm db:push` (ou `pnpm drizzle-kit migrate`).
   - **Via Railway CLI:** Se tiver a CLI instalada, rode `railway run "pnpm drizzle-kit migrate"`.

## Resumo do Processo de Deploy

1. Acesse o painel da Railway e crie um **New Project**.
2. Selecione **Deploy from GitHub** e escolha o repositório `samuell07g-beep/Resellers`.
3. Adicione um serviço de banco de dados (MySQL) se não for usar um externo.
4. Vá em **Settings > Variables** e configure as variáveis mencionadas acima.
5. Vá em **Settings > Build** e garanta que os comandos de build e start estão configurados como `pnpm install && pnpm build` e `pnpm start`.
6. Aguarde o deploy finalizar.
7. Execute as migrations do banco de dados.

O commit com o código extraído já foi enviado com sucesso para a branch `main` do seu repositório!
