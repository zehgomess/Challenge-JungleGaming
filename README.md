# Jungle Gaming Frontend Challenge

Implementação do desafio: https://github.com/junglegaming/frontend-challenge

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix)
- TanStack Router + TanStack Query
- React Hook Form + Zod
- Axios
- MSW (+ `@mswjs/socket.io-binding`)
- Socket.IO Client
- Playwright (E2E/visual - estrutura)
- Lighthouse (auditoria - estrutura)

## Setup
```bash
npm install
```

## Variáveis de ambiente
- `VITE_API_URL` (opcional): base da API REST. Padrão: `/api` (compatível com MSW).
- `VITE_MSW_MODE` (opcional): `off` desativa mocks; `mock`/`on` força mocks; em `DEV` os mocks são iniciados por padrão.
- `VITE_WS_URL` (opcional): origem do Socket.IO. Padrão: `window.location.origin`.

> O projeto foi preparado para operar com camada mockada (REST + eventos Socket.IO simulados) no ambiente de desenvolvimento/demo.

## Credenciais fictícias
- **E-mail:** `collector@jungle.io`
- **Senha:** `password123`

(Conflito de cadastro simulado: `existing@jungle.io`)

## Execução
```bash
# desenvolvimento
npm run dev

# typecheck
npm run typecheck

# build de produção
npm run build

# preview do build
npm run preview
```

## Cenários simulados (MSW) e reset
- Catálogo com busca/filtros/ordenação/paginação, detalhe, favoritos por usuário autenticado.
- Carrinho com quote (subtotal/desconto/taxa/total) e cupons: `JUNGLE20` (20%), `EXPIRED` (expirado), outros inválidos.
- Checkout/pedido com criação, confirmação, idempotência básica e eventos `order.updated`/`nft.updated` via binding Socket.IO.
- Perfil/carteiras e validações de senha (senha atual fictícia: `password123`).

**Reset de estado:**
- Recarregue a página para reinicializar o worker/estado em memória do MSW.
- Limpe `localStorage`/`sessionStorage` do domínio para resetar sessão, carrinho e retomadas (`auth_token`, `auth_user`, `cart:*`, `auth_resume_to`, etc.).

## Fluxos implementados
- Rotas: home, detalhe NFT, carrinho, pagamento, confirmação de pedido, login, registro, perfil, carteiras.
- Proteção de fluxos privados com redirecionamento e `returnTo`.
- Sessão persistente (refresh), tratamento de expiração (401/evento) com tentativa de retomada.
- Catálogo/detalhe com estados loading/empty/error/success e parâmetros na URL.
- Carrinho com persistência/merge visitante→usuário, cupom e totais via API mock.
- Pagamento/confirmação com revisão, simulação de carteira/rede, revalidação pré-confirmação, idempotência e recibo snapshot.
- Perfil e carteiras com validações e persistência via mock.
- Sincronização real-time inicial via `socket.io-client` consumindo eventos emitidos pela camada MSW (`@mswjs/socket.io-binding`).

## Reprodução de fluxos de falha (exemplos)
- **Login inválido:** usar credenciais diferentes das fictícias.
- **Registro conflito:** usar `existing@jungle.io`.
- **Cupom inválido/expirado:** aplicar `INVALIDO` ou `EXPIRED` no carrinho.
- **Conexão de carteira recusada (simulada):** selecionar rede `Polygon` no pagamento e simular conexão.
- **Mudança de condições no checkout:** alterar cupom/itens para gerar diferença de quote e exigir nova revisão.
- **Sessão expirada:** remover token/forçar 401 em chamadas autenticadas; fluxo redireciona para login com retomada.

## Testes e qualidade (estado)
- Scripts/configurações para Playwright e Lighthouse estão previstos no `package.json`; a suíte completa de cenários, baselines visuais versionadas e relatórios finais devem ser executados/gerados no ambiente de avaliação conforme os requisitos do desafio.
- Diretório `reports/` reservado para artefatos de auditoria/testes.

## Deploy
- Preparado para deploy estático (Vite build) com rewrite SPA (`vercel.json`).
- **Obrigatório pelo desafio:** publicar URL pública (Vercel/Netlify/Cloudflare Pages) correspondente ao código commitado, com mocks e real-time funcionando em produção e suporte a acesso direto/refresh de rotas.

## Limitações conhecidas
- Implementação incremental: algumas exigências avançadas (cenários E2E/visual completos, relatórios Lighthouse consolidados, reconciliação real-time abrangente e determinismo total de eventos/casos de borda) podem requerer complementação adicional para conformidade integral com todos os critérios eliminatórios do desafio.
- Socket.IO mockado via binding em ambiente browser/MSW; comportamento depende do cenário e da inicialização do worker.
