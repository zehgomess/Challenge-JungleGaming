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

## Qualidade
```bash
npm run typecheck
npm run lint
npm run test:e2e
npm run lighthouse:audit
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
- Detalhe com quantidade limitada pela disponibilidade; o contrato mock atual oferece uma edição e uma imagem por NFT.
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
- **Playwright (E2E/visual):** suíte executável em `tests/e2e/`; **86/86 testes passaram** no último run, com fluxos em desktop 1440px/mobile 390px e regressão visual em tablet 768px (`workers: 1`). Inclui sessão/troca de conta, retry, quote, reconexão/pedido pendente, histórico, aborto explícito de busca obsoleta, seleção de quantidade no detalhe e dados do colecionador no pagamento. Baselines para **home, detalhe, carrinho e pagamento** estão em `tests/e2e/visual.spec.ts-snapshots/`.
- **Lighthouse:** 3 runs por cenário para home/detalhe desktop/mobile estão versionados em `reports/lighthouse-full-categories-2026-11-17/` (matriz completa da produção) e em `reports/lighthouse-deployed-2026-11-17/` (matriz performance-only). Resumos e JSON/HTML estão junto aos relatórios.
- **Lighthouse produção — matriz completa, medianas:** home mobile perf 0.97 / accessibility 1.00 / best practices 1.00 / SEO 1.00; detalhe mobile 0.98 / 1.00 / 1.00 / 1.00; desktop 1.00 nas quatro categorias. LCP mediano: 2.350 s home mobile / 2.315 s detalhe mobile; 522/477 ms desktop.
- **Acessibilidade/SEO:** `lang="pt-BR"`, erros de formulário associados e anunciados, wallet address validado; a matriz completa atual atinge as metas Lighthouse. Ainda falta concluir a revisão manual de foco/teclado em todos os fluxos.

## Deploy
- **URL pública (Vercel, produção):** https://challenge-jungle-gaming-lac.vercel.app/
- Preparado para deploy estático (Vite build) com rewrite SPA (`vercel.json`) e mocks/real-time ativos na demo (não definir `VITE_MSW_MODE=off`).
- Build: `npm run build` (ou `npm ci && npm run build`) — Output: `dist`.
- **Validação em produção:** home e rota direta `/nfts/nft-2`, `mockServiceWorker.js`, login, Socket.IO e evento `nft.updated` foram verificados no browser; confirmar novamente após cada deploy.

## Limitações conhecidas
- O demo é client-side com MSW; dados simulados não persistem em um backend compartilhado entre sessões/dispositivos.
- A aplicação tem um shell progressivo de carregamento; a mediana Lighthouse oficial de LCP mobile está em ~2.3 s, embora TBT/tempo até a aplicação ficar totalmente interativa varie por perfil de auditoria. A fidelidade pixel a pixel ainda precisa ser conferida por comparação direta com os frames Figma, e a auditoria manual de foco/teclado precisa cobrir todos os fluxos.
- Galeria e edição alternativas ainda não estão modeladas no contrato (cada NFT tem uma imagem/edição); o mock também mantém senhas fictícias em memória. `npm run lint` ainda aponta erros de tipagem/regras de hooks em arquivos existentes.
