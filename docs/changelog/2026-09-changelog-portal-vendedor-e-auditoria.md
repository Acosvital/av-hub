# Changelog — Auditoria de arquitetura, Portal do Vendedor e correções de responsividade

Branch `feature/estudo-novas-features`. Cobre da criação da branch (04/09) até 07/09/2026.
Nenhum item aqui foi commitado ainda no momento em que este changelog foi escrito. Ordem
cronológica.

---

## 1. Auditoria de arquitetura (separação de camadas)

Rodei uma auditoria com múltiplos agentes (busca em paralelo por área do sistema + verificação
adversarial de cada achado) cobrindo `app/api`, `services`, `components` e `app/(protected)`.
28 achados brutos, 17 confirmados após verificação (11 rejeitados como orquestração aceitável
de route handler — ex.: agregação multi-vínculo, checagem de posse anti-IDOR). A pedido
explícito, **tudo relacionado a comissão (`dash-comissoes`) foi ignorado** — outro dev
mexendo nessa área. Corrigidos os 17 achados confirmados:

**Arquivos novos (extração de lógica de domínio, antes solta em rotas/componentes):**
- `lib/api/meuDashboardDomain.ts` — `intervaloDoMes`/`classificarPedidos`/`topClientes`/
  `somarLado`, extraídos de `app/api/meu-dashboard/route.ts` (que virou só orquestração).
- `services/dashboards/vendorDetailsMapper.ts` — `resolveCategory`/`resolveStatus`/
  `mapVendorDetails`, extraídos de `components/Dashboards/VendorDetailsModal/VendorDetailsModal.tsx`.
- `utils/slaPedido.ts` — cálculo de SLA (dias até vencimento, faixas de urgência), extraído de
  `app/(protected)/meus-pedidos/page.tsx`.

**Arquivos novos (duplicação centralizada em fonte única):**
- `utils/grupoPedidoClassificacao.ts` — classificação G1-G6 (rótulo+cor), antes duplicada com
  divergência de cor entre `meus-pedidos/page.tsx`, `minhas-notas/page.tsx`,
  `dash-faturamento-por-tipo/page.tsx` e `dash-vendas-por-tipo/page.tsx`.
- `utils/metaColor.ts` — régua de cor por % de meta batida, antes duplicada entre
  `VendorCard.tsx` e `meu-dashboard/page.tsx` (o próprio código já comentava a duplicação sem
  ter corrigido).
- `utils/orderTypeColors.ts` — tabela categoria→cor, antes duplicada com estrutura levemente
  diferente entre `Order.tsx` e `OrderType.tsx`.
- `utils/resultadoBuscaDashboard.ts` — mapeamento tipo de resultado→dashboard, extraído de
  `OverlayHeader.tsx`.
- `utils/buscaHeuristics.ts` — heurísticas de busca por regex nomeadas (antes regex anônimo
  solto), usadas em `pedidos-de-venda/page.tsx` e `cadastros/auxiliares/unidades/page.tsx`.
  As duas heurísticas são deliberadamente diferentes (uma checa "só dígitos", outra "contém
  dígito") — não foram unificadas, documentado no próprio comentário do módulo.
- `lib/api/paginacaoMultiVinculo.ts` — bloco flatten+sort+paginação em memória, duplicado
  quase literalmente entre `app/api/meus-pedidos/route.ts` e `app/api/minhas-notas/route.ts`.
- `lib/uploadConstraints.ts` — `MIME_TYPES_PERMITIDOS`/`TAMANHO_MAXIMO_BYTES` num módulo neutro
  (sem import de `aws-sdk`), porque `lib/s3/fotos.ts` (de onde vinham antes) é server-only e
  não pode ser importado por `components/Ui/PhotoUpload/PhotoUpload.tsx` (client component)
  sem arrastar o SDK pro bundle do navegador.
- `services/menu.ts` — `components/Layout/AppLayout/Menu/Menu.tsx` fazia `fetch('/api/menu')`
  direto, único componente do app que não passava pela camada de `services/`.
- `lib/s3/fotos.ts` ganhou `comFotosAssinadas()` — o padrão `Promise.all + map +
  assinarUrlFoto condicional` estava duplicado entre `app/api/unidades/route.ts` e
  `app/api/funcionarios/route.ts`.

**Consolidação de duplicidade com efeito colateral de segurança:**
`services/rh/referenciais.ts` reescrito para delegar às funções canônicas de
`services/cadastros/auxiliares/{cargos,setores,unidades}.ts` em vez de manter uma segunda
implementação apontando para `/api/referenciais/*`. Essa segunda implementação **não aplicava
`comEscopoUnidade`** (escopo por unidade) que a canônica já aplicava — ou seja, as 3 páginas que
usavam `referenciais.ts` (`vendedores`, `solicitacoes-de-vagas`, `pedidos-de-venda`) estavam
ignorando o escopo de permissão por unidade. Rotas órfãs deletadas:
`app/api/referenciais/{cargos,setores,unidades}/route.ts`.

**10 arquivos de `services/`** (`cargos`, `usuarios`, `metasMensais`, `parceiros`, `produtos`,
`setores`, `unidades`, `funcionarios`, `solicitacoesDeVagas`, `vendedores`) — a função
`deletar*` de cada um reimplementava manualmente `fetch + !res.ok + res.text() + throw`, o
mesmo que `apiFetch` (`lib/api/fetchHelper.ts`) já encapsula. Trocado por `apiFetch` direto,
confirmando antes que a rota Next.js correspondente sempre retorna `{success:true}` (logo
`res.json()` nunca falha em corpo vazio).

**Correções pontuais:**
- `app/api/parceiros/todosFornecedores/route.ts` — `estado=SP` hardcoded virou parâmetro
  opcional (rota aparentemente sem consumidor real no código-fonte).

**Verificação:** `npx tsc --noEmit` e `npx eslint .` limpos após cada etapa; testado ao vivo no
browser (dev server) abrindo `VendorDetailsModal` no dashboard de Vendas — categorias e cor do
chip "SEM CLASSIFICAÇÃO" renderizando corretamente após a extração.

---

## 2. Tela de login: responsividade e margem

**Arquivo:** `app/(public)/login/styles.module.css`

Pedido inicial: "está tudo muito grande e esticado", precisa de margem em cima/embaixo.
Investigação em 3 rodadas até a causa real:

1. Primeira tentativa: `overflow-y:auto` no lugar de `overflow:hidden` — não resolveu, porque
   `align-items:center` num flex container com conteúdo maior que a viewport tem um bug
   conhecido do Chrome/Blink (a centralização "esconde" o topo do conteúdo em vez de permitir
   rolar até ele).
2. Correção real: técnica `margin: auto 0` no `.card` (centraliza sem o bug de clipping — se
   não houver espaço, degrada graciosamente pro fluxo normal em vez de cortar).
3. A pedido ("você ainda não entendeu... faça ser responsiva, sem parecer estourado"):
   investigação mais a fundo revelou que o `.card` tinha ~645px de altura (gaps de
   `var(--space-7)`=40px repetidos 4× + logo de 260px), perto do limite de notebooks comuns
   (~650-750px úteis) — daí a margem ficar desigual. Compactado: gaps reduzidos
   (`space-7`→`space-5`), logo com `width: clamp(180px, 24vw, 260px)`, novo breakpoint
   `@media (max-height: 700px)` compactando ainda mais em telas baixas.

Testado em 1536×726 (94px de margem simétrica), 1366×650 (breakpoint ativo, 85px simétrico) e
500px de altura extrema (sem cortes, só scroll).

---

## 3. Redirecionamento pós-login: 403 no console + "gambiarra" revisitada

**Achado:** logado como vendedora, o console mostrava `Erro ao buscar vínculos de usuário e
perfil — status 403` e `Erro ao buscar perfis — status 403`.

**Causa:** `app/(protected)/page.tsx` chamava `getUsuariosPerfis`/`getPerfis` (endpoints
admin-only, `requirePermission('usuarios-perfis'|'perfis', ...)`) só para descobrir o nome do
perfil do usuário logado e decidir a tela inicial (`Vendedor`→`/meu-dashboard`,
`RH - Joanes`/`RH - Analistas`→`/rh/solicitacoes-de-vagas`). Perfis sem essas permissões de
cadastro (a maioria) recebiam 403 e o redirecionamento **nunca acontecia** — o vendedor ficava
preso numa home vazia.

**Correção (arquivo `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`):** nova
função `fetchInfoPerfisDoUsuario` busca os perfis do usuário **direto no backend** (mesmo
padrão já usado por `fetchMenu` no mesmo arquivo — chamada server-to-server com API key, não
passa pelas rotas gateadas do próprio Hub) e guarda em `session.user.perfis`/`telaInicialId`.
`app/(protected)/page.tsx` reescrito para ler da sessão em vez de fazer fetch.

**"Você fez gambiarra?"** — pergunta direta do usuário sobre a correção acima. Resposta: não,
o padrão replica exatamente o que `fetchMenu` já fazia no mesmo arquivo; a checagem de
permissão existe para proteger telas de cadastro contra usuários sem acesso de admin, não para
a própria sessão descobrir "qual é o meu perfil". Reconhecido como dívida técnica real: a
lógica de comparar **nome de perfil** (string hardcoded) pra decidir rota já era marcada
`// TODO: lógica provisória` no código original.

**Eliminação da dívida (a pedido — "como podemos oficializar um método"):** confirmado que o
schema do backend (`auth.perfis`) não tem campo de tela inicial. Preparado o lado do frontend
para consumir um futuro `tela_inicial_id`, com fallback pro comportamento atual enquanto o
backend não implementa:

- `utils/menuTree.ts` — `encontrarPathDoItem()` resolve a rota de qualquer tela andando a
  árvore do menu do próprio usuário (zero mapa de rotas hardcoded — a árvore do menu já é essa
  fonte única).
- `app/(protected)/cadastros/acessos/perfis/{page,types}.tsx` — campo "Tela inicial" (select
  alimentado pelas telas-folha de `/telas`) já pronto no cadastro de Perfis.
- `app/(protected)/page.tsx` — tenta `session.user.telaInicialId` primeiro; só cai no bloco
  marcado `FALLBACK TEMPORÁRIO` (comparação por nome) se o backend ainda não configurou.
- Documentado o contrato completo (SQL, API, rollout) em
  [`docs/contrato-tela-inicial-por-perfil.md`](../contrato-tela-inicial-por-perfil.md).

---

## 4. Responsividade mobile — as 3 telas do Portal do Vendedor

A pedido, com prints de celular real mostrando os problemas:

**a) Date picker (`MesSeletor`) estourando a tela** — `components/Ui/MesSeletor/{MesSeletor.tsx,MesSeletor.module.css}`.
`.menu` usava `right: 0` (cresce pra esquerda a partir do botão); em telas estreitas, se o
botão não fica colado na borda direita (não fica, quando o cabeçalho quebra linha), o
calendário estourava pra fora à esquerda. Corrigido: `@media (max-width: 640px)` centraliza o
menu na **tela** (`left:50%; transform:translateX(-50%)`), não mais no botão; `DateCalendar`
ganhou `width:'100%', maxWidth:340`. Bônus: `meus-pedidos/styles.module.css` e
`minhas-notas/styles.module.css` não tinham `flex-wrap` no cabeçalho (só `meu-dashboard`
tinha) — adicionado para consistência.

**b) Faixa sem o glow de fundo, atrás do botão de menu fixo** —
`meu-dashboard/styles.module.css`, `meus-pedidos/styles.module.css`,
`minhas-notas/styles.module.css`. Essas 3 telas foram as únicas, de 20 telas com o mesmo padrão
`.pageGlow::before`, sem o `@media (max-width: 768px)` que estica o glow pra cobrir o respiro
reservado ao botão de menu mobile (`Layout.module.css .mainAreaMobileOffset`) — as outras 17
(ex.: `rh/funcionarios`, `cadastros/acessos/telas`) já tinham essa correção, com o comentário
"senão sobra uma faixa lisa sem o efeito ali", literalmente descrevendo o bug reportado.
Reaplicado o mesmo `@media` exato nas 3.

*(Nota: nessa investigação eu inicialmente mexi em `components/Charts/Gauge/Gauge.tsx`
seguindo uma pista errada — revertido com `git checkout --` assim que o usuário indicou que o
problema era no cabeçalho, não no gauge.)*

---

## 5. Meu Dashboard: rankings truncados, "ver mais", soft glass, respiro final

A pedido, com print mostrando nomes de cliente cortados ("TERCOFLAN ...", "CITRO...").

**a) Truncamento de nome** — `app/(protected)/meu-dashboard/{page.tsx,styles.module.css}`.
`.nomeCliente` tinha `white-space:nowrap` + `text-overflow:ellipsis` numa linha só ao lado de
posição/pedidos/valor — não cabia em mobile. Reestruturado com wrappers
`.linhaClienteTopo`/`.linhaClienteMeta` (`display:contents` no desktop — zero mudança visual
lá; no mobile viram duas linhas reais, nome quebrando por conta própria em vez de truncar).

**b) Botão "Ver mais"/"Ver menos"** nos dois rankings (`verTodosTopClientes`/
`verTodosInativos`, estado local). Para o ranking de melhores clientes, o backend
(`lib/api/meuDashboardDomain.ts`, `topClientes()`) só buscava/retornava 5 — aumentado o limite
por vínculo de `10`→`20` e o corte final de `slice(0,5)`→`slice(0,20)`, dando dado real para o
"ver mais" revelar (exibe 5 por padrão, até 20 expandido).

**c) Soft glass** — a pedido ("estes cards devem ter o mesmo estilo das telas de cadastro").
`.tile` e `.listaClientes` não tinham `backdrop-filter: blur(18px) saturate(140%)` (só
borda/sombra/fundo translúcido) — as outras 19 telas com `.tableCard` já tinham. Adicionado nos
dois. Fundo glow (`.pageGlow::before`) já conferido idêntico ao das telas de cadastro (`diff`
sem diferença) — nada a corrigir aí.

**d) Sem respiro no fim da página** — bug do Chromium (confirmado por medição em
`getBoundingClientRect`): nem `padding-bottom` no `.pageGlow` nem `margin-bottom` no último
filho são contados de forma confiável no `scrollHeight` de um ancestral com `overflow-y:auto`
quando o filho é ele mesmo um container flex. Resolvido com um **spacer real** (`div` com
`height: var(--space-5)`, não margin/padding) como último elemento sempre renderizado —
imune a esse bug por ser conteúdo de verdade, não uma propriedade de espaçamento. Confirmado:
48px de respiro real, testado em desktop e mobile.

---

## 6. Bug de dados — "Meta Individual" com valor 7-18× maior que o correto

A pedido: "a meta individual não está sendo contada corretamente [...] não está considerando
todos os vendedores de todas as unidades".

**Investigação:** escrito um script Node temporário (`scratchpad/investigar-meta{1,2,3}.mjs`,
usando `API_URL`/`API_KEY` de `.env`) para consultar a API de produção direto e comparar. Duas
hipóteses testadas e descartadas/refinadas:

1. Primeira hipótese (rejeitada pelo usuário — "a meta é global, não por unidade"): cada
   unidade teria sua própria meta, dividida só pelos vendedores que venderam naquela unidade.
2. Hipótese confirmada por aritmética exata: existe **uma única meta global** (R$29.000.000,00,
   de `dashboard_mensal_vendas.consolidado.meta`), e a API a divide **duas vezes,
   independentemente por unidade** — `29.000.000 / 7` (vendedores com venda numa unidade
   satélite) = R$4.142.857,14; `29.000.000 / 36` (vendedores com venda na unidade grande) =
   R$805.555,56. Um vendedor com vínculo nas duas unidades (`somarLado` em
   `lib/api/meuDashboardDomain.ts` soma corretamente os dois) acaba com
   R$4.948.412,70 — quase 17% da meta global inteira, sozinho.

**Conclusão:** não é bug de frontend — `somarLado` soma exatamente o que a API devolve; o
valor de origem já vem errado. Documentado com evidência completa (requests reais, valores,
diagnóstico e o que muda no backend) em
[`docs/ENVIAR - contrato-meta-individual-divisor-incorreto.md`](<../ENVIAR - contrato-meta-individual-divisor-incorreto.md>).
Também documentado um efeito colateral pendente no frontend: quando o backend corrigir e
`meta_individual` passar a vir **igual pra todo vendedor** (por ser uma fração global), a soma
atual por vínculo em `somarLado` vai passar a **duplicar** a meta de quem tem vínculo em mais
de uma unidade — ação futura já anotada no próprio contrato, não implementada agora (depende da
correção do backend primeiro).

---

## Verificação (transversal a todas as seções)

- `npx tsc --noEmit -p .` limpo após cada mudança.
- `npx eslint .` (repo inteiro) sem novos erros — só os 7 warnings pré-existentes,
  não relacionados (`dash-vendas` import não usado, `<img>` do login, `eslint-disable`
  não usado no `Menu.tsx`).
- Testado ao vivo no browser (dev server, `preview_start`) em múltiplas resoluções: mobile
  (375×812), notebook (1366×650/768), desktop (1440×900, 1536×726, 1920×1080) — screenshots e
  medições via `getBoundingClientRect`/`getComputedStyle` conferindo cada correção visual.
