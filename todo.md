# Proxy Revendedores - TODO

## Banco de Dados
- [x] Tabela `local_users` (autenticação própria: username, password_hash, role)
- [x] Tabela `products` (produtos com nome)
- [x] Tabela `product_variants` (variações: 1 dia R$5, 7 dias R$10, 30 dias R$15)
- [x] Tabela `keys_stock` (estoque de keys por variante)
- [x] Tabela `orders` (pedidos com status e dados PIX)
- [x] Tabela `order_keys` (keys liberadas por pedido)

## Backend
- [x] Autenticação própria: register, login com JWT (sem OAuth)
- [x] Admin fixo: ADMIN / ADMIN999
- [x] Router de produtos: listar produtos e variantes com estoque disponível
- [x] Router de estoque: adicionar keys por variante (admin), listar estoque, atualizar preço
- [x] Router de pedidos: criar pedido, gerar PIX MisticPay
- [x] Polling para confirmar pagamento e liberar keys automaticamente
- [x] Router admin: listar usuários, listar compras por usuário, listar todos os pedidos
- [x] Notificação ao admin quando compra for confirmada

## Frontend
- [x] Tema dark/cyberpunk: azul escuro, roxo, verde neon
- [x] Página inicial / loja com produto Proxy iOS e variações
- [x] Seletor de plano e quantidade com cálculo automático de valor
- [x] Fluxo de compra: formulário CPF → QR Code PIX → aguardar pagamento
- [x] Página "Minhas Compras" com lista de keys e validade
- [x] Página de Login e Cadastro próprios
- [x] Painel Admin: produtos, estoque de keys, usuários e compras
- [x] Gerenciamento de estoque: inserir keys por variante (uma por linha)
- [x] Exibir quantidade disponível em estoque no produto

## Testes
- [x] Teste de autenticação própria (login admin fixo, usuário inválido, duplicado)
- [x] Teste de listagem de produtos
- [x] Teste de proteção de rotas admin
- [x] Teste de logout (cookie)


## Melhorias Solicitadas
- [x] Painel admin com menu lateral (sidebar) em vez de abas
- [x] Melhorar UX do formulário de adicionar estoque (deixar mais visível)

- [x] Melhorar responsividade mobile do painel admin (sidebar colapsável automático, layout fluido)
- [x] Melhorar responsividade mobile de todas as páginas (loja, checkout, minhas compras)


## Bugs Corrigidos
- [x] Corrigir endpoint de verificacao de pagamento PIX (MisticPay): mudou de GET /transactions/{id} para POST /transactions/check
- [x] Adicionar logging detalhado no checkPixStatus para debugar problemas de pagamento
- [x] Melhorar conexao com banco de dados (adicionar logging de erro)
