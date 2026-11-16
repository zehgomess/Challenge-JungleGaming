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

## Testes e qualidade (executado)
- **Playwright (E2E/visual):** suíte executável em `tests/e2e/` com cenários de navegação/catálogo, auth/favoritos, carrinho/cupom, checkout/confirmação e perfil/carteiras; baselines visuais versionadas para **home, detalhe, carrinho e pagamento** em **desktop e mobile** (`tests/e2e/visual.spec.ts-snapshots/`). Relatório HTML em `reports/playwright/index.html` e traces/resultados em `test-results/`.
- **Lighthouse:** matriz executada em build preview com MSW para **home e detalhe, mobile e desktop, 3 runs por cenário** (HTML/JSON em `reports/lighthouse/`). Medianas e justificativas finais devem ser consolidadas a partir dos JSONs conforme exigido.
- **Execução local realizada:** `npm run build`, smoke/flows E2E e geração de artefatos no ambiente de desenvolvimento.

## Deploy
- **URL publicada (Vercel, deploy temporário/transferido para conta):** https://spry-xenon-6sz1i9j.tmp.now  
  - Publicado via `vercel deploy dist --temporary` (a partir do build local `dist`) e resgatado/vinculado à conta no Vercel. Deploys temporários podem expirar; **substitua pela URL de produção definitiva** do projeto (ex. `https://<projeto>.vercel.app`) quando disponível e valide paridade com o commit publicado.
- Preparado para deploy estático (Vite build) com rewrite SPA (`vercel.json`) e mocks/real-time ativos na demo (não definir `VITE_MSW_MODE=off`).
- **Obrigatório pelo desafio:** manter URL pública correspondente ao código commitado, com mocks e real-time funcionando em produção e suporte a acesso direto/refresh de rotas.

**Para publicar/atualizar o deploy definitivo na sua conta Vercel:**
1. Importe/conecte o repositório `zehgomess/Challenge-JungleGaming` no [Vercel Dashboard](https://vercel.com/dashboard) (branch `main`).
2. Build command: `npm run build` (ou `npm ci && npm run build`) — Output directory: `dist` — não definir `VITE_MSW_MODE=off`.
3. Faça deploy/redeploy e confirme status **Ready**; copie a **Production URL** em *Project → Domains/Visit* ou *Deployments*.
4. Valide: `mockServiceWorker.js` registrado, rotas diretas/refresh, login `collector@jungle.io`/`password123`, carrinho/checkout/confirmação e eventos real-time; depois atualize esta seção com a URL definitiva.

## Limitações conhecidas
- Implementação incremental: algumas exigências avançadas (cenários E2E/visual completos, relatórios Lighthouse consolidados, reconciliação real-time abrangente e determinismo total de eventos/casos de borda) podem requerer complementação adicional para conformidade integral com todos os critérios eliminatórios do desafio.
- Socket.IO mockado via binding em ambiente browser/MSW; comportamento depende do cenário e da inicialização do worker.
