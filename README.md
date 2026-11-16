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
- Playwright (E2E, visual regression e traces)
- Lighthouse (matrizes local e de produção)

## Setup
```bash
npm install
```

## Variáveis de ambiente
- `VITE_API_URL` (opcional): base da API REST. Padrão: `/api` (compatível com MSW).
- `VITE_MSW_MODE` (opcional): `off` desativa mocks; `mock`/`on` força mocks; por padrão os mocks são ativos em dev, preview e produção.
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
- Contas registradas com token e estado isolados (perfil, senha, favoritos, carteiras, carrinho e pedidos por `userId`).
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
- Sincronização real-time via `socket.io-client` consumindo eventos emitidos pela camada MSW (`@mswjs/socket.io-binding`), com reconexão, deduplicação, versão e escopo de pedidos por usuário.

## Reprodução de fluxos de falha (exemplos)
- **Login inválido:** usar credenciais diferentes das fictícias.
- **Registro conflito:** usar `existing@jungle.io`.
- **Cupom inválido/expirado:** aplicar `INVALIDO` ou `EXPIRED` no carrinho.
- **Conexão de carteira recusada (simulada):** selecionar rede `Polygon` no pagamento e simular conexão.
- **Mudança de condições no checkout:** alterar cupom/itens para gerar diferença de quote e exigir nova revisão.
- **Sessão expirada:** remover token/forçar 401 em chamadas autenticadas; fluxo redireciona para login com retomada.

## Testes e qualidade (executado)
- **Playwright (E2E/visual):** suíte executável em `tests/e2e/`; **82/82 testes passaram** no último run local (`workers: 1`): fluxos funcionais em Chromium desktop (1440px) e mobile (390px), mais regressão visual em tablet (768px). Inclui sessão/troca de conta, retry, quote, reconexão/pedido pendente, histórico e validação por teclado. Baselines para **home, detalhe, carrinho e pagamento** estão em `tests/e2e/visual.spec.ts-snapshots/`.
- **Lighthouse:** 3 runs por cenário para home/detalhe desktop/mobile estão versionados em `reports/lighthouse/` (preview) e `reports/lighthouse-production/` (Vercel). Resumos: `reports/lighthouse/SUMMARY.md` e `reports/lighthouse-production/SUMMARY.md`.
- **Lighthouse produção (medianas):** home desktop 1.00 / mobile 0.80; detalhe desktop 1.00 / mobile 0.81. CLS de detalhe 0.010 desktop / 0.036 mobile. LCP mobile permanece ~3.8 s e deve ser comparado com o alvo do enunciado; relatórios contêm LCP/TBT e diagnósticos.
- **Acessibilidade/SEO:** `lang="pt-BR"`, erros de formulário associados e anunciados, wallet address validado; última auditoria Lighthouse production: accessibility/best-practices/SEO 100/100/100.

## Deploy
- **URL pública (Vercel, produção):** https://challenge-jungle-gaming-lac.vercel.app/
- Preparado para deploy estático (Vite build) com rewrite SPA (`vercel.json`) e mocks/real-time ativos na demo (não definir `VITE_MSW_MODE=off`).
- Build: `npm run build` (ou `npm ci && npm run build`) — Output: `dist`.
- **Validação em produção:** home e rota direta `/nfts/nft-2`, `mockServiceWorker.js`, login, Socket.IO e evento `nft.updated` foram verificados no browser; confirmar novamente após cada deploy.

## Limitações conhecidas
- O demo é client-side com MSW; dados simulados não persistem em um backend compartilhado entre sessões/dispositivos.
- O LCP mobile ainda está próximo de 4 s; a fidelidade pixel a pixel precisa ser conferida contra o arquivo Figma de referência, indisponível neste ambiente. A auditoria de foco/teclado ainda deve ser completada em todos os fluxos/componentes.
