# Changelog — padronização do dashboard de Vendas

Registro do que foi alterado nesta rodada de padronização do lado
esquerdo do `dash-vendas` (e do que isso trouxe de volta para
`dash-faturamento`, por compartilharem componentes), e por quê. Ordem
cronológica.

## 1. Bug fix: className `autoScroll` virava a string `"false"`

**Arquivos:** `dash-vendas/page.tsx`, `dash-faturamento/page.tsx`

`` `${cond && styles.autoScroll}` `` quando `cond` é falso produz a
string literal `"false"` como className (JS: `false && x` retorna
`false`, mas dentro de um template string vira o texto `"false"`).
Trocado por `cond ? styles.autoScroll : ''`.

## 2. Novo componente `DashboardHeroLayout`

**Arquivo novo:** `components/Dashboards/DashboardHeroLayout/`

O grid de dashboards é fixo em 12 colunas x 6 linhas
(`DashboardGrid.module.css`). Cada página escolhia `cols`/`rows` na
mão, o que gerou bugs de gap/sobreposição quando as linhas de uma
coluna não fechavam em 6. Criado um componente com 4 zonas fixas
(`hero`, `ranking`, `secondaryStats`, `secondaryPace`) para o padrão
"indicador principal + ranking", começando pelo Vendas. Documentado em
[README.md](./README.md).

- Proporção inicial: `hero` 6x3, `secondaryStats` 2x3, `secondaryPace`
  4x3, `ranking` 6x6.
- Ajustada depois para `secondaryStats` 3x3 / `secondaryPace` 3x3 (a
  pedido: as duas caixas secundárias deveriam ter o mesmo peso visual
  em vez de uma ficar bem mais estreita que a outra).

## 3. Novos componentes compartilhados: `SectionCard`, `CardHeader`, `DailyStatCard`

**Arquivos novos:** `components/Dashboards/{SectionCard,CardHeader,DailyStatCard}/`

Auditoria encontrou `.defaultCard`/`.cardHeader`/`.billingCard` com o
MESMO NOME mas implementações diferentes em `dash-vendas` e
`dash-faturamento` (CSS duplicado, não compartilhado), e 3 "idiomas"
de cabeçalho de card diferentes lado a lado no Vendas (RevenueGauge,
o antigo `.cardTitle`, e o `GoalPaceCard`). Criados:

- `SectionCard` — wrapper com fundo/cantos arredondados, aceita um
  `header` opcional que renderiza um `CardHeader` colado nas bordas do
  card (sem o padding padrão do card "vazando" por baixo do
  cabeçalho).
- `CardHeader` — cabeçalho único (ícone/dot + título + slot direito
  para pill/contador), usado por `GoalPaceCard` e pelos títulos "Venda
  Diária"/"Volume de Pedidos".
- `DailyStatCard` — par "Hoje/Ontem", substituindo o CSS
  `.billingCard` que existia duplicado em Vendas e Faturamento.

`GoalPaceCard` foi migrado para usar `SectionCard` internamente (antes
tinha seu próprio container com CSS quase idêntico).

**`styles/dashboard-tokens.css`** (novo, importado em `globals.css`):
classe global `.sectionLabel` para o `text-transform: uppercase` que
antes era redeclarado de forma independente em 3+ lugares.

## 4. Limpeza de CSS morto

**Arquivos:** `dash-vendas/styles.module.css`, `GoalPaceCard.module.css`

Removidos: `.defaultCard`/`.cardTitle`/`.billingCard`/`.billingTitle`/
`.billingValue` (migrados para os componentes acima), `.loading`
(não referenciada — o loading é feito via `WidgetLoading`), e
`.sectionHeader > h3` no `GoalPaceCard` (órfã, o título real era
`h4.headerTitle`).

## 5. Gauge maior e sem fundo

**Arquivos:** `Gauge.tsx`, `RevenueGauge.tsx`, `RevenueGauge.module.css`

Pedido: dashboard vai rodar numa TV, o indicador principal precisava
ser mais visível.

- `Gauge`: tamanho 200→240px; número central `fs-3xl`→`fs-4xl`, `%`
  `fs-base`→`fs-lg`.
- `RevenueGauge`: o container (`.gaugeContainer`) chegou a ganhar um
  fundo (`var(--card-bg)`) numa iteração, e depois foi removido de
  novo a pedido explícito ("o gráfico de gauge deve ficar sem o
  fundo") — fica transparente, integrado ao fundo da página.

## 6. Valores do Gauge agrupados, não mais nas bordas

**Arquivo:** `RevenueGauge.module.css` (`.totalRevenueValues`)

"Venda Total"/"Meta" e "Mês Passado"/"Pedidos M.P." usavam
`justify-content: space-between`, que empurra os dois blocos para as
bordas opostas do card — pedido era deixá-los mais próximos um do
outro. Trocado para `justify-content: center` + `gap: var(--space-8)`.

A linha divisória abaixo da primeira linha (`border-bottom`) ficava
esticada por 100% da largura do card, muito maior que o conteúdo
centralizado acima dela ("a linha está muito grande"). Trocado
`width: 100%` por `width: fit-content; margin: 0 auto`, de forma que a
linha acompanhe só a largura do conteúdo.

"Mês Passado"/"Pedidos M.P." (linha secundária) tiveram a fonte
reduzida e a cor escurecida (`var(--navy-400)`), a pedido — eram do
mesmo tamanho/cor da linha principal e deveriam ter menos destaque
visual.

## 7. `DailyStatCard`: sem caixa, Hoje/Ontem diferenciados, linha divisória

**Arquivo:** `DailyStatCard.tsx` / `.module.css`

Reformulado para bater com uma referência visual trazida pelo usuário:
removida a caixa/borda que envolvia cada par Hoje/Ontem; "Hoje" ganhou
destaque (label verde, valor branco em negrito) e "Ontem" ficou opaco
(cinza, mesmo peso de fonte reduzido).

Depois, a pedido, foi adicionada de volta uma linha vertical
(`border-right`) separando as colunas Hoje/Ontem — mas dessa vez
"reta e conectada ponta a ponta": a implementação inicial deixava a
linha "flutuando" (parava ~12px antes da borda inferior do card,
porque o padding do `SectionCard.body` "comia" esse espaço). Resolvido
com uma margem negativa (`margin: calc(var(--space-3) * -1) 0`) que
cancela o padding vertical do body só para este componente, fazendo a
linha tocar a borda inferior real do card.

Por fim, o texto (label + valor) ficou colado no topo do card, com
espaço vazio embaixo. Cada coluna (`.dailyStatCard > div`) virou um
flex column com `justify-content: center`, centralizando o bloco
verticalmente dentro da altura total do card (a centralização
horizontal via `text-align: center` já estava correta — confirmado
por medição, o efeito "não centralizado" percebido era só vertical).

## 8. `GoalPaceCard`: rótulo renomeado, linha divisória ponta a ponta

**Arquivo:** `GoalPaceCard.tsx` / `.module.css`

O rótulo do segundo card ("Meta Diária Atual") foi trocado para
"Média Real Atual" (para bater com uma referência visual), depois
para **"Meta Diária Real"** — a pedido explícito do usuário, por
considerar esse o texto melhor.

A linha horizontal que separa "Meta Diária Ideal" de "Meta Diária
Real" (`.metaCard:first-child { border-bottom }`) tinha o mesmo
problema de "flutuar" sem tocar as bordas laterais do card, pela mesma
causa (padding do body). Corrigido com
`margin: 0 calc(var(--space-4) * -1)` em `.metaCards`, cancelando o
padding horizontal do body só para esse conjunto — como o padding
horizontal de `.metaCard` já era do mesmo valor, o texto não se
deslocou, só a linha passou a alcançar as bordas.

## 9. Cores: `--navy-900` e `--navy-800`

**Arquivos:** `SectionCard.module.css`, `CardHeader.module.css`

A pedido, depois de o usuário perguntar se as cores `#0C1327` e
`#181F32` existiam no sistema de tokens (não existiam exatamente; as
mais próximas eram `--navy-900`/`--av-tertiary` e `--navy-800`):

- Fundo do corpo dos cards ("Venda Diária", "Volume de Pedidos",
  "Ritmo de Meta") trocado de `var(--card-bg)` para `var(--navy-900)`.
- Fundo da barra de cabeçalho (`CardHeader`) trocado de
  `var(--card-bg-secondary)` para `var(--navy-800)`.
- Cor do texto do cabeçalho (título) escurecida de `var(--foreground)`
  (branco) para `var(--navy-100)`.

## 10. Card do Ranking (Vendas): mesmo esquema de cores + linha sob o cabeçalho

**Arquivo:** `dash-vendas/styles.module.css` (`.card`, `.cardHeader`, `.rankingTitle`)

O card de Ranking (lado direito) usava `.card`/`.cardHeader` locais,
específicos desse dashboard — não passavam por `SectionCard`/
`CardHeader` porque o conteúdo do ranking (podium + lista com
auto-scroll) é bem mais complexo que os slots genéricos desses
componentes. Para não ficar destoante visualmente dos cards do lado
esquerdo, apliquei manualmente o mesmo esquema de cor:

- `.card` (corpo): `var(--card-bg-secondary)` → `var(--navy-900)`.
- `.cardHeader` (barra com "RANKING" e "N vendedores"): ganhou fundo
  `var(--navy-800)` e `border-bottom: 1px solid var(--border)` — antes
  não tinha fundo próprio nem linha, o texto "flutuava" solto no topo
  do card. `padding` trocado de "só topo" (`height:10%` + padding-top)
  para o padrão de barra cheia (`space-3 space-4` em todos os lados).
- `.rankingTitle` e o texto "N vendedores": cor escurecida para
  `var(--navy-100)`, igual ao título dos outros cards.

## 11. Faturamento: mesmas correções de baixo risco aplicadas

**Arquivos:** `dash-faturamento/page.tsx`, `dash-faturamento/styles.module.css`

Como `RevenueGauge`, `GoalPaceCard` e `DailyStatCard` são componentes
compartilhados, todas as mudanças visuais acima (gauge sem fundo,
cores dos cards, linhas divisórias, centralização) já se refletem
automaticamente no Faturamento. Além disso, aplicado lá manualmente:
o mesmo fix do bug `autoScroll`, e a troca do `.billingCard` duplicado
pelo novo `DailyStatCard` nos widgets "Faturamento Diário" e "Volume
de Notas Fiscais".

## 12. Novo card "Vendas por Tipo" (SPOT / CONTRATO / SEM CLASSIFICAÇÃO)

**Arquivos novos:** `app/api/dashboard/vendas/vendas-por-tipo/route.ts`
**Arquivos alterados:** `services/dashboardVendas.ts`, `dash-vendas/types.ts`,
`dash-vendas/page.tsx`, `dash-vendas/styles.module.css`,
`DashboardHeroLayout.tsx`

Pedido: mostrar no Vendas o mesmo tipo de quebra que já existe no
Faturamento ("Tipo de faturamento"), mas para vendas — por
SPOT/CONTRATO/SEM CLASSIFICAÇÃO. Diferente do Faturamento, não havia
endpoint agregado pronto (só existia o breakdown por vendedor
individual, em `DetalheVendedorVendasResumoProps`). O endpoint real
(`/vendas_por_tipo_contrato?mes&ano`) foi confirmado com o usuário e
integrado seguindo exatamente o padrão já usado por
`getFaturamentoPorTipo`:

- Rota proxy `vendas-por-tipo/route.ts` (mesmo formato das outras
  rotas de dashboard: repassa `page/limit/mes/ano/tipo_contrato` para
  `${API_URL}/vendas_por_tipo_contrato`).
- `getVendasPorTipo` em `dashboardVendas.ts`.
- Tipo `VendasPorTipoProps` em `dash-vendas/types.ts` — ajustado depois
  que o usuário mandou o schema oficial: `tipo_contrato` é um enum
  (`'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO'`), `vendas` é
  `number | null` (não string, diferente do padrão do resto da API de
  vendas) e `qtd_pedidos` é `number`.

**Layout:** o grid do Vendas já usava as 6 linhas disponíveis (Gauge=3
+ [secundárias]=3), sem espaço para um 4º card sem quebrar a premissa
de "cabe tudo numa tela de TV sem rolagem". `DashboardHeroLayout`
ganhou um slot opcional `tertiary` (6 cols x 1 row, abaixo de
`secondaryStats`/`secondaryPace`); quando informado, essas duas zonas
encolhem de 3 para 2 rows cada, mantendo a soma em 6. O novo card usa
`SectionCard` com `header` (mesmo padrão dos outros) e uma lista
horizontal de 3 itens com divisórias verticais entre eles (rótulo +
valor em `toBRL`), no mesmo espírito visual do `.billings`/`.billing`
do Faturamento, porém adaptado ao formato mais baixo (1 row) do slot.

**Não alterado em Faturamento** (documentado como débito técnico no
[README.md](./README.md)): `.defaultCard`/`.card`/`.cardHeader`
próprios daquele dashboard, que ainda têm `border`/`box-shadow`
diferentes dos equivalentes em Vendas.

## 13. Nova escala de cor: `--navy-925` e `--navy-915`

**Arquivo:** `styles/variables.css`

A pedido, confirmado que `#0C1327` e `#0E1122` não existiam como
tokens exatos (o mais próximo era `--navy-900`). Criados dois novos
degraus na escala navy, entre `--navy-950` e `--navy-900`:

- `--navy-925: #0c1327`
- `--navy-915: #0e1122`

Essa escala mais granular substituiu o esquema anterior
(`--navy-900`/`--navy-800`, item 9) por um de 3 camadas mais
consistente, usado em todos os dashboards a partir daqui:
`--navy-950` (fundo da página) → `--navy-850` (corpo dos cards) →
`--navy-925` (faixas internas, "afundadas", dentro dos cards) →
`--navy-915` (borda de 1px em todos os cards).

## 14. Sistema de 3 camadas aplicado a Vendas: fundo da página, cards, faixas internas, bordas

**Arquivos:** `SectionCard.module.css`, `RevenueGauge.module.css`,
`GoalPaceCard.module.css`, `DailyStatCard.module.css`,
`dash-vendas/styles.module.css`, `dash-vendas/page.tsx`

- **Fundo da página:** `.dashboardContainer` ganhou
  `background-color: var(--navy-950)`. Como o `<main>` (`Layout.module.css`
  `.mainArea`) tem `padding` próprio, pintar só o container deixava uma
  moldura mais clara (`--av-primary`) visível ao redor — corrigido
  fazendo o fundo "sangrar" até a borda real da área principal:
  `width`/`height: calc(100% + var(--space-4) * 2)` + `margin:
  calc(var(--space-4) * -1)` + `padding: var(--space-4)` (largura/altura
  explícitas em vez de `100%`, porque margem negativa sozinha não
  expande a caixa — só desloca a posição; sem isso a borda direita/inferior
  continuava faltando).
- **Cards:** `SectionCard` e o `.card` do Ranking passaram a usar
  `background-color: var(--navy-850)` e ganharam
  `border: 1px solid var(--navy-915)` (antes não tinham borda nenhuma).
  O gauge (`RevenueGauge`), que ficava "solto" sem nenhum card visível
  ao redor (decisão do item 5), também ganhou essa mesma borda —
  a pedido explícito, para não destoar dos demais.
- **Faixas internas:** onde antes havia conteúdo direto no `body` do
  card, passou a existir uma faixa com `background-color:
  var(--navy-925)` "afundada" visualmente em relação ao `--navy-850`
  do card: `DailyStatCard` (Hoje/Ontem/valores), `GoalPaceCard`
  `.metaCards` (Meta Diária Ideal/Real) e `.tipoVendaRow` (Vendas por
  Tipo). Todas usam a mesma técnica de "sangria": margem negativa
  igual ao padding do container pai + padding de volta do mesmo valor,
  fazendo a faixa preencher exatamente a área útil do card sem sobrar
  moldura do `--navy-850`.
- **"Vendas por Tipo" virou faixa única:** os 3 itens
  (SPOT/CONTRATO/SEM CLASSIFICAÇÃO) eram caixas arredondadas
  individuais (`.tipoVendaItem` com fundo/`border-radius`/margem
  próprios) — a pedido ("remova o card embaixo de..."), viraram uma
  única faixa contínua (fundo movido para `.tipoVendaRow`) com
  divisórias verticais simples (`border-right`) entre os itens, igual
  ao padrão do `DailyStatCard`.

### Bugs encontrados e corrigidos nessa mesma rodada

- **`GoalPaceCard` "flutuando" como card dentro do card:** ao dar
  fundo `--navy-925` para `.metaCards`, sobrava uma faixa de
  `--navy-850` (12px) acima e abaixo dele, porque `.metaCards` tinha
  `height: 100%` dentro de um `.body` com `justify-content: center` —
  `height: 100%` não preenche de fato um container flex-column de
  altura automática, então o elemento ficava menor que o card e o
  `justify-content: center` centralizava, sobrando espaço nas pontas.
  Trocado `height: 100%` por `flex: 1`.
- **Linha divisória com "ponta curva":** `.metaCard:first-child` tinha
  `border-bottom` mas o próprio `.metaCard` também tinha
  `border-radius: var(--radius-md)` (resquício de quando cada metaCard
  tinha fundo próprio) — o raio arredondava as pontas da linha.
  Removido o `border-radius` (não fazia mais sentido depois que o
  fundo passou a ser só de `.metaCards`).
- **Ranking com faixa de cor errada embaixo:** mesma causa do bug
  acima, só que em `.defaultRank` (`height: 60%` dentro de `.card`
  sem nenhum item com `flex: 1` esticando até o fim) — sobrava
  `--navy-850` visível depois do fim da lista de vendedores. Trocado
  `height: 60%` por `flex: 1; min-height: 0`.

## 15. Ondas de fundo removidas do layout (`.shell`)

**Arquivo:** `components/Layout/AppLayout/Layout.module.css`

A pedido ("remova as ondas lá do fundo"): `.shell` tinha
`background: var(--waves-bg) no-repeat center bottom / cover` (SVG
`layered-waves(-dark).svg`, visível atrás de todo o conteúdo, em toda
a aplicação — não só nos dashboards). Trocado por
`background: var(--av-primary)` (cor sólida, sem a imagem).

## 16. Tarjinha "ACIMA"/"ABAIXO" (`GoalPaceCard`): menor, mais sóbria, e lado a lado no Faturamento

**Arquivo:** `GoalPaceCard.tsx` / `.module.css`

Pedido em duas rodadas: primeiro "melhorada" (peso de fonte, borda
sutil na cor do status, mais padding), depois "diminua, mais sóbria" —
resultado final:

- Tamanho reduzido: `font-size` para `10px`, ícone de `14`→`11px`,
  padding `4px var(--space-3)` → `2px var(--space-2)`.
- Cor trocada de `--success-soft`/`--danger-soft` (verde-menta/vermelho
  claros, muito saturados sobre fundo escuro) para
  `color-mix(in srgb, var(--success|danger) 16%, var(--navy-900))` no
  fundo e `color-mix(in srgb, var(--success|danger) 55-60%, white)` no
  texto — um verde/vermelho petróleo escuro com texto suave, mais
  discreto.
- Nova prop `orientation?: 'column' | 'row'` (padrão `'column'`, mantém
  o comportamento existente no Vendas). Usada com `orientation="row"`
  só no Faturamento (a pedido: "ritmo de meta do faturamento deve ser
  colocado horizontalmente lado a lado" — o widget lá é bem mais largo
  e baixo que no Vendas). A classe `.metaCardsRow` troca
  `flex-direction` para `row` e a divisória de `border-bottom` para
  `border-right`.

## 17. Faturamento nivelado com Vendas: cores, bordas, e cards individuais para "Faturamento Diário"/"Volume de Notas Fiscais"

**Arquivos:** `dash-faturamento/styles.module.css`,
`dash-faturamento/page.tsx`, `BillingHistoryChart.module.css`

Resolve o débito técnico registrado no item 12/README ("`.defaultCard`/
`.card`/`.cardHeader` de Faturamento ainda têm `border`/`box-shadow`
diferentes do visual chapado adotado em Vendas"). A pedido explícito
("aplique essas melhorias de design para o faturamento"):

- `.dashboardContainer`, `.defaultCard`, `.card`/`.cardHeader`/
  `.fixedRank`/`.defaultRank` (Ranking) e `BillingHistoryChart`
  passaram pelo mesmo sistema de 3 camadas do item 14
  (`--navy-950`/`--navy-850`/`--navy-925` + borda `--navy-915`),
  removendo `box-shadow` e o `border: 1px solid var(--border)`
  genérico que cada um tinha.
- `.situationCard` (grid 2x2 de "Situação") e `.billing` (lista de
  "Tipo de Faturamento") perderam o fundo/borda/`border-radius`
  individuais — viraram uma faixa única `--navy-925` (`.situationGroup`/
  `.billings`) com divisórias simples (`border-right`/`border-bottom`
  via `:nth-child`), no mesmo espírito da mudança do item 14 em
  "Vendas por Tipo".
- **"Faturamento Diário"/"Volume de Notas Fiscais"**: antes eram dois
  blocos (`<h3>` + `DailyStatCard`) empilhados dentro de UM único
  `.defaultCard`. A pedido ("deve ter um design igual ao Venda
  Diária e Volume de Pedidos"), viraram dois `SectionCard`
  independentes com `header` (título + bolinha verde/azul) dentro de
  um `.stackedSections`, replicando exatamente a estrutura do Vendas
  (`.stackedSections`/`.titleDot`/`.dotGreen`/`.dotBlue` copiadas para
  `dash-faturamento/styles.module.css`).
- `GoalPaceCard` do Faturamento passou `orientation="row"` (item 16).

Com isso o débito técnico do item 12/README fica resolvido — ver
atualização no [README.md](./README.md).

## Verificação

Todas as etapas foram conferidas com `npx tsc --noEmit`, `npx eslint`
e inspeção visual via browser (screenshots + medições de
`getBoundingClientRect`/`getComputedStyle` para confirmar cor exata em
`rgb()`/alinhamento pixel a pixel, já que o dev server das sessões
ficava em outra aba e nem sempre era possível tirar screenshot
diretamente). `npm run build` rodou limpo após a fase inicial de
padronização.
