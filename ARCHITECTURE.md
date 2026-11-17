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

**Emissão:** handlers REST do MSW emitem eventos através do binding (`src/mocks/socket.ts` + `emitToAll`/`emitToUser`) quando o estado simulado muda (ex.: criação/confirmação de pedido e ajustes de disponibilidade). O endereço é a origem atual (incluindo HTTPS); o `socket.io-client` é carregado somente depois de `enableMocking()` instalar o interceptor, e eventos mockados saem por `SocketIoDuplexConnection.client.emit`.

**Consumo:** `SocketManager` (`src/components/socket-manager.tsx`) conecta via `socket.io-client`, identifica a sessão ativa, aplica deduplicação por versão/`updated_at`, invalida/refaz queries relevantes e exibe feedback; na reconexão (`connect`) dispara invalidações para reconciliação com REST. E2E cobre conexão ativa, queda/reconexão, preço/disponibilidade, pedido pendente, duplicatas, eventos fora de ordem e isolamento de pedidos entre usuários.

## Sessão e autenticação
- **Persistência:** token/usuário em `localStorage` para recuperação após refresh; chaves legadas de `sessionStorage` limpas no fluxo.
- **Expiração:** interceptor Axios trata `401` disparando `session-expired`; provider limpa sessão e cache e preserva caminho de retomada (`auth_resume_to`).
- **Proteção de rotas:** `requireAuth` em `beforeLoad` redireciona para login com `returnTo`; login/registro consomem retorno/retomada.
- **Isolamento REST/cache:** cada token de demo mapeia para um usuário próprio; favoritos, carteiras, perfil, credenciais e pedidos são isolados por `userId`. Chaves de cache incluem o usuário quando os dados são privados; logout/login limpa o cache e reinicializa deduplicação/assinaturas.

## Carrinho e checkout
- **Estado:** `CartProvider` com persistência em `localStorage` (visitante e por usuário) e merge de itens do visitante ao autenticar.
- **Regras:** atualização de quantidade limitada por disponibilidade conhecida; remoção de itens; cupom persistido no estado do carrinho.
- **Totais:** obtidos de `/api/cart/quote` para consistência com resposta da API; revalidação no pagamento antes de confirmar.
- **Pagamento/confirmação:** simulação de carteira/rede/conexão, revisão e aceite de mudanças, idempotência na criação/confirmação, estados pending/confirmed/refused, recibo snapshot e remoção apenas dos itens/quantidades comprados após confirmação efetiva.

## Estratégia de cache e reconciliação
- TanStack Query como fonte de cache servidor; chaves privadas incluem `userId` (`nfts`, `nft`, `order`, `wallets`) e eventos invalidam por prefixo. Ao mudar filtros/busca, consultas ativas do catálogo são canceladas antes de navegar; o teste E2E observa a requisição antiga abortada e confirma que o resultado tardio não substitui a busca atual.
- Eventos real-time disparam invalidações/refetches para aproximar estado REST↔Socket.IO; reconexão força reconciliação das consultas ativas/relevantes.
- `keepPreviousData` no catálogo para transições de paginação/filtros sem flicker; E2E cobre restauração do histórico e resposta lenta antiga não substituindo o resultado de busca mais recente.

## Decisões e limitações
- **MSW em browser + socket binding:** abordagem adequada para demo sem backend real; os controles `__test` permitem cenários determinísticos de falha/reconexão. A aplicação continua sendo uma simulação cliente, sem backend persistente compartilhado entre sessões/dispositivos.
- **Escopo de eventos de pedido:** cada cliente identifica a sessão após conectar; `order.updated` é enviado somente aos sockets associados ao dono do pedido, e a UI rejeita eventos de outro `userId`.
- **Disponibilidade/preço em tempo real:** cotação é refeita no carrinho/checkout e submit bloqueia preço/disponibilidade desatualizados. Alterações concorrentes e cancelamento são cobertos em E2E; executar contra infraestrutura externa real ainda depende de backend Socket.IO fora do mock do browser.
- **Fidelidade visual/acessibilidade/performance:** baselines visuais para home/detalhe/carrinho/pagamento estão versionadas em desktop/mobile, com tablet em 768 px. Os frames Figma foram consultados e os tokens/estrutura responsiva foram aproximados, mas ainda falta comparação pixel a pixel e ajuste dos desvios apontados nos comentários. A revisão manual de foco/teclado em todos os fluxos também está pendente. Formulários principais têm idioma pt-BR, `aria-invalid`, `aria-describedby` e `role=alert`. A matriz Lighthouse completa de produção está em `reports/lighthouse-full-categories-2026-11-17/`: todas as categorias atendem às metas; LCP mobile mediano de 2.350 ms home / 2.315 ms detalhe. O shell progressivo reduz o tempo até o primeiro conteúdo, mas TBT/tempo até a aplicação ficar totalmente interativa ainda variam por perfil de auditoria.
- **Testes E2E/visual e auditorias:** Playwright executa Chromium 1440px, mobile 390px e baseline visual tablet 768px com um worker; a suíte atual passou 82/82 localmente, incluindo histórico, aborto de busca obsoleta, retry de detalhe e acessibilidade básica dos formulários. `reports/playwright` é artefato gerado; não tratar mudanças automáticas do relatório como evidência versionada sem revisar o conteúdo.

## Desvios potenciais em relação ao Figma
- O arquivo Figma foi acessado e as principais telas/referências de arte foram usadas para orientar a identidade visual. Ainda não foi executada uma comparação visual automatizada contra os frames originais; galeria e seleção de edição/quantidade no detalhe, textos de colecionáveis e pequenos alinhamentos permanecem candidatos a refinamento.
