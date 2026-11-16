# Architecture

## Visão geral
Aplicação SPA em React + TypeScript (Vite) com roteamento client-side (TanStack Router), estado servidor/cache (TanStack Query), formulários/validação (React Hook Form + Zod), camada HTTP (Axios) e simulação de backend/real-time via MSW + Socket.IO binding.

## Estrutura principal
- `src/routes/*`: rotas file-based (home, detalhe, carrinho, pagamento, confirmação, auth, perfil, carteiras).
- `src/components/*`: UI compartilhada (navbar, socket manager) e componentes shadcn/ui.
- `src/store/*`: providers/estado cliente (sessão, carrinho, query client).
- `src/api/*`: clientes REST tipados (auth, nfts, cart quote, orders).
- `src/mocks/*`: handlers REST MSW, worker browser e binding Socket.IO.
- `src/lib/*`: utilitários (auth guards, socket client).
- `src/types/*`: contratos de domínio/transportes usados na UI.

## Contratos REST (simulados via MSW)
- `GET /api/nfts` — lista com `search`, `edition`, `availability`, `sort`, `order`, `page`, `limit`.
- `GET /api/nfts/:id` — detalhe (404 quando inexistente).
- `POST/DELETE /api/nfts/:id/favorite` — favorito (auth).
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `PATCH /api/auth/profile`, `POST /api/auth/change-password`.
- `GET/POST/PATCH /api/auth/wallets` — carteiras registradas.
- `POST /api/cart/quote` — cálculo de subtotal/desconto/taxa/total e validação de cupom.
- `POST /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/confirm` — pedidos com idempotência básica.

> Contratos são tipados em `src/types` e consumidos por módulos `src/api/*`; a UI consome dados via TanStack Query e estado local dos providers.

## Eventos Socket.IO (simulados)
- `nft.updated` — atualização de preço/disponibilidade (`id`, `price`, `availability`, `updated_at`).
- `order.updated` — atualização de status de pedido (`orderId`, `status`, `updated_at`).

**Emissão:** handlers REST do MSW emitem eventos através do binding (`src/mocks/socket.ts` + `emitToAll`) quando o estado simulado muda (ex.: criação/confirmação de pedido e ajustes de disponibilidade).

**Consumo:** `SocketManager` (`src/components/socket-manager.tsx`) conecta via `socket.io-client`, aplica deduplicação simples por chave/`updated_at`, invalida/refaz queries relevantes e exibe feedback; na reconexão (`connect`) dispara invalidações para reconciliação com REST.

## Sessão e autenticação
- **Persistência:** token/usuário em `localStorage` para recuperação após refresh; chaves legadas de `sessionStorage` limpas no fluxo.
- **Expiração:** interceptor Axios trata `401` disparando `session-expired`; provider limpa sessão e cache e preserva caminho de retomada (`auth_resume_to`).
- **Proteção de rotas:** `requireAuth` em `beforeLoad` redireciona para login com `returnTo`; login/registro consomem retorno/retomada.
- **Isolamento:** logout/troca limpa cache React Query e estado de sessão; eventos/assinaturas devem ser liberados ao encerrar ciclo de vida (base implementada no manager de socket).

## Carrinho e checkout
- **Estado:** `CartProvider` com persistência em `localStorage` (visitante e por usuário) e merge de itens do visitante ao autenticar.
- **Regras:** atualização de quantidade limitada por disponibilidade conhecida; remoção de itens; cupom persistido no estado do carrinho.
- **Totais:** obtidos de `/api/cart/quote` para consistência com resposta da API; revalidação no pagamento antes de confirmar.
- **Pagamento/confirmação:** simulação de carteira/rede/conexão, revisão e aceite de mudanças, idempotência na criação/confirmação, estados pending/confirmed/refused, recibo snapshot e remoção apenas dos itens/quantidades comprados após confirmação efetiva.

## Estratégia de cache e reconciliação
- TanStack Query como fonte de cache servidor com invalidação por chave (`nfts`, `nft`, `order`, `wallets`, etc.).
- Eventos real-time disparam invalidações/refetches para aproximar estado REST↔Socket.IO; reconexão força reconciliação das consultas ativas/relevantes.
- `keepPreviousData` no catálogo para transições de paginação/filtros sem flicker.

## Decisões e limitações
- **MSW em browser + socket binding:** abordagem adequada para demo sem backend real; determinismo completo de cenários, escopo por usuário em eventos e cobertura exaustiva de reconexão/duplicatas exigem evolução adicional.
- **Disponibilidade/preço em tempo real:** eventos emitidos em pontos-chave do fluxo simulado; cenários específicos do desafio (ex.: alteração enquanto item está no carrinho com bloqueio total de cotação obsoleta em todos os casos) podem demandar instrumentação adicional.
- **Fidelidade visual/acessibilidade/performance:** base de layout e componentes implementada, porém ajustes finos de Figma, acessibilidade completa e otimizações de bundle/métricas Lighthouse permanecem como trabalho incremental.
- **Testes E2E/visual e auditorias:** estrutura/scripts previstos; execução, geração de baselines versionadas, relatórios/traces e evidências formais devem ser concluídas no pipeline/ambiente de avaliação.

## Desvios potenciais em relação ao Figma
- Sem acesso ao arquivo Figma neste ambiente, a implementação prioriza estrutura responsiva, componentes shadcn/ui e consistência funcional; tokens visuais (tipografia, espaçamentos, proporções exatas) devem ser ajustados para correspondência pixel-fiel conforme o design de referência.
