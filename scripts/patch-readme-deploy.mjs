import fs from 'fs'
const path = 'README.md'
let text = fs.readFileSync(path, 'utf8')
const start = text.indexOf('## Deploy')
const end = text.indexOf('\n## Limitações conhecidas')
if (start === -1 || end === -1) throw new Error('markers not found')
const replacement = `## Deploy
- **URL publicada (Vercel, deploy temporário/transferido para conta):** https://spry-xenon-6sz1i9j.tmp.now  
  - Publicado via \`vercel deploy dist --temporary\` (a partir do build local \`dist\`) e resgatado/vinculado à conta no Vercel. Deploys temporários podem expirar; **substitua pela URL de produção definitiva** do projeto (ex. \`https://<projeto>.vercel.app\`) quando disponível e valide paridade com o commit publicado.
- Preparado para deploy estático (Vite build) com rewrite SPA (\`vercel.json\`) e mocks/real-time ativos na demo (não definir \`VITE_MSW_MODE=off\`).
- **Obrigatório pelo desafio:** manter URL pública correspondente ao código commitado, com mocks e real-time funcionando em produção e suporte a acesso direto/refresh de rotas.

**Para publicar/atualizar o deploy definitivo na sua conta Vercel:**
1. Importe/conecte o repositório \`zehgomess/Challenge-JungleGaming\` no [Vercel Dashboard](https://vercel.com/dashboard) (branch \`main\`).
2. Build command: \`npm run build\` (ou \`npm ci && npm run build\`) — Output directory: \`dist\` — não definir \`VITE_MSW_MODE=off\`.
3. Faça deploy/redeploy e confirme status **Ready**; copie a **Production URL** em *Project → Domains/Visit* ou *Deployments*.
4. Valide: \`mockServiceWorker.js\` registrado, rotas diretas/refresh, login \`collector@jungle.io\`/\`password123\`, carrinho/checkout/confirmação e eventos real-time; depois atualize esta seção com a URL definitiva.
`
text = text.slice(0, start) + replacement + '\n' + text.slice(end + 1)
fs.writeFileSync(path, text)
console.log('patched')
