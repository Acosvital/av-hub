# Plano — Portal do Vendedor (autoatendimento)

**Data:** 04/09/2026, 12:10 (horário de Brasília — data/hora do arquivo local, documento
ainda não commitado).

**Objetivo:** um perfil "Vendedor" que, ao logar, vê um resumo das próprias vendas/faturamento
e uma lista dos próprios pedidos com contagem regressiva de SLA até a previsão de faturamento.
v1 é só consulta — nada de criar/editar pedido ou nota pelo Hub.

**Por que isso não é um "contrato-*.md":** ao contrário dos outros documentos desta pasta, este
não pede nada novo ao backend. Toda a base de dados necessária já existe (levantado por
inspeção do código nesta sessão) — é puramente um plano de implementação frontend + Next.js.

---

## 1. Vínculo: como o sistema sabe "esse usuário é esse vendedor"

Reaproveita a cadeia que já existe, sem coluna nova:

```
sessão (usuarios.id_funcionario)
  → GET /vendedores?id_funcionario=<id>
  → lista de { codigo_vendedor_omie, codigo_empresa } — uma linha por unidade/conta Omie
```

Um funcionário pode ter mais de uma linha em `vendedores` (o caso dos ~5 vendedores que vendem
em Mogi e Uberaba, resolvido no contrato `contrato-vinculo-vendedor-funcionario.md`) — o portal
trata isso naturalmente: todas as linhas vinculadas entram no escopo do usuário, os números do
"Meu Dashboard" já saem consolidados entre as unidades.

**Pré-requisito de dado, não de código:** o usuário vendedor precisa ter `id_funcionario`
preenchido (tela de Usuários já tem esse campo) e existir uma linha em `vendedores` com esse
mesmo `id_funcionario` (tela de Vendedores, já com o campo "Funcionário Vinculado"). Sem isso,
o portal mostra vazio — mesmo comportamento defensivo já usado no escopo por setor.

---

## 2. Segurança do escopo — sem mudança de backend

Hoje `GET /pedidos-venda` e `GET /notas-fiscais-saida` aceitam `codigo_vendedor` como parâmetro
enviado pelo cliente — modelo pensado pra tela de admin, que escolhe qual vendedor quer ver.
Isso **não pode** ser a fronteira de segurança do autoatendimento (dá pra trocar o parâmetro na
URL).

Solução: os novos endpoints do portal (`/api/meus-pedidos`, `/api/minhas-notas`,
`/api/meu-dashboard`) resolvem os `codigo_vendedor_omie` do usuário **no servidor**, a partir da
sessão (`getServerSession`), e chamam os endpoints existentes travados nesses códigos —
**nunca aceitando `codigo_vendedor` vindo do request**. Mesmo padrão de isolamento que
`comEscopoUnidade`/`escopoSetor` já usam, só que resolvido inteiramente do lado do Next.js (não
precisa de `id_usuario_sessao` no backend externo, porque o filtro já é aplicado antes de
chamar o endpoint de admin).

Se o funcionário tiver mais de um `codigo_vendedor_omie` (multi-unidade), a rota faz uma
chamada por código e agrega em memória antes de paginar/devolver — não precisa que o backend
aceite uma lista.

---

## 3. Perfil e telas novas (cadastro de dados, não código)

Registrar via telas já existentes (Perfis, Telas, Permissões):

| Tela (slug) | Nome | Pai |
|---|---|---|
| `meu-dashboard` | Meu Dashboard | raiz (item de menu próprio) ou dentro de um grupo "Vendedor" |
| `meus-pedidos` | Meus Pedidos | mesmo grupo |
| `minhas-notas` | Minhas Notas Fiscais | mesmo grupo |

Perfil **Vendedor**: `pode_visualizar = true` nas 3 telas acima, sem acesso a mais nada (nem
Pedidos de Venda/Notas Fiscais "de admin", nem Dashboards gerais — o vendedor não deveria ver o
ranking dos colegas).

**Único ponto de código necessário:** como são um item de menu de **topo** novo (não afiliado a
"Vendas"), precisam de entrada em `groupMap.ts`/`iconMap.tsx`
(`components/Layout/AppLayout/Menu/MenuItem/`) — telas dentro de um grupo já existente não
precisariam disso.

---

## 4. As 3 telas

### 4.1 Meu Dashboard

Resumo do mês — reaproveita o mesmo cálculo de `dashboard_mensal_vendas`/`ritmo_meta_vendas`,
só que travado nos códigos do vendedor: total vendido, % da meta, ritmo (adiantado/atrasado),
comparação com mês anterior.

**Meta individual — fechado.** Confirmação do Nathan: é a meta mensal dividida pelo número de
vendedores ativos. Testei ao vivo pra achar de onde vem: `meta_individual` em
`ranking_vendedores_vendas` (R$ 1.764.705,88, no mês testado) bate **exatamente** com meta do
mês (R$ 30.000.000) ÷ quantidade de vendedores retornados naquele ranking (17) — o backend já
faz essa conta. Ou seja, **não precisa recalcular nada**: "Meu Dashboard" busca
`ranking_vendedores_vendas`/`ranking_vendedores_faturamento` (mesmos parâmetros já usados nas
outras chamadas — mes/ano/codigo_empresa), acha a linha com `cod_vendedor` do usuário, e lê
`meta_individual`/`perc_meta` prontos de lá. Se o vendedor tiver mais de uma unidade, pega a
linha correspondente em cada ranking (um por `codigo_empresa`) e soma, mesma lógica de
agregação já usada em 4.2.0.

**Cuidado:** não confundir com `GET /vendedores?ativo=true` (a flag `ativo` do cadastro do
vendedor) — testei e os números não batem (70 vendedores com `ativo=true` na base inteira vs.
17 no ranking daquele mês/escopo). "Vendedores ativos" pra essa conta quer dizer "vendedores
que aparecem no ranking daquele período/escopo", não o campo `ativo` da tabela. Como o valor já
vem pronto por linha, isso não afeta a implementação — só evita reimplementar a conta errado.

**Os 3 números do topo — todos já existem, nenhum cálculo novo:**

| O que mostrar | Campo | De onde |
|---|---|---|
| Meta individual | `meta_individual` | linha do vendedor em `ranking_vendedores_vendas`/`_faturamento` |
| % de participação na meta total | `perc_participacao` | mesma linha do ranking (já rotulado "% de participação" no `VendorCard` de hoje) |
| Meta total (da empresa/unidade) | `meta` | `dashboard_mensal_vendas`/`_faturamento` (`consolidado.meta` ou por unidade — já corrigido nesta sessão, ver commit do bug "meta não aparecia") |

**Regra de cor ao passar de 100% — já existe, é a mesma do `VendorCard`:**
```ts
function getMetaColor(percMeta: number) {
  if (percMeta <= 100) return 'var(--blue)';
  if (percMeta <= 200) return 'var(--green)';
  if (percMeta <= 300) return 'var(--orange)';
  if (percMeta <= 400) return 'var(--pink)';
  return 'var(--gold)';
}
```
Aplicada sobre `perc_meta` (% da meta **individual** batida, não da meta total). Reaproveita a
função tal como está — não precisa reescrever.

**Confirmado com o Nathan — intencional, não é lacuna:** o lado de Faturamento também tem
`perc_meta` (% da meta individual batida) e `perc_participacao` (% de participação na meta
total), os mesmos dois números de Vendas — só que **sem** a régua de cor por faixa. Ou seja,
pro "Meu Dashboard": os dois números aparecem nas duas metades (vendas e faturamento), mas a
cor muda com o tier **só do lado de vendas**; faturamento mostra os mesmos números com cor
fixa, igual o `VendorCard` já faz hoje.

### 4.2 Meus Pedidos

#### 4.2.0 Resumo no topo da tela

Pedido do Nathan: mostrar, na parte de cima da tela, o total vendido no mês + quantidade de
pedidos, e o total faturado no mês + quantidade de notas. Isso **já existe pronto** — é
exatamente o `DetalheVendedorVendasResumoProps`/`DetalheVendedorFaturamentoResumoProps` que o
admin já usa no `VendorDetailsModal` (`valor_total` + `total_pedidos` pro lado de vendas,
`valor_total` + `total_nfs` pro lado de faturamento), só que hoje só é chamado quando um admin
clica num vendedor no ranking. As rotas já aceitam exatamente os parâmetros que o portal
precisa:

```
GET /api/dashboard/vendas/detalhe-vendedor?cod_vendedor=<X>&codigo_empresa=<Y>&mes=<M>&ano=<A>
GET /api/dashboard/faturamento/detalhe-vendedor?cod_vendedor=<X>&codigo_empresa=<Y>&mes=<M>&ano=<A>
```

Pra montar o resumo:
1. Resolve os pares `{codigo_vendedor_omie, codigo_empresa}` do usuário (seção 1).
2. Chama as duas rotas acima pra cada par, com `mes`/`ano` do mês atual.
3. Se o vendedor tiver mais de uma unidade, soma `valor_total`/`total_pedidos`/`total_nfs` de
   cada chamada — não precisa de endpoint novo nem de somar registro por registro (pedido a
   pedido, nota a nota), a API já devolve o agregado por vendedor/mês.

Sem essa reaproveitação, a alternativa seria buscar todos os pedidos/notas do mês e somar no
frontend — desnecessário, já que o agregado certo já existe no backend.

Lista de `PedidoVendaProps` (mesmo tipo já usado em `vendas/pedidos-de-venda`), travada nos
códigos do vendedor. Conferi o `types.ts` de novo pra listar os campos reais disponíveis (não
é wishlist, é o que já vem no dado):

**Campos a mostrar por pedido:**
- `numero_pedido` — identificador visível (não o `codigo_pedido_omie`, que é interno/Omie).
- **`data_inclusao`/`hora_inclusao`** — quando o pedido foi feito (pedido do Nathan nesta
  mensagem — hoje nem a tela de admin mostra isso, seria novo).
- `data_previsao` — base do selo de SLA (seção 5).
- `valor_total_pedido`.
- `situacao` — já vem como texto (ex.: "Faturado parcialmente"), não precisa de dicionário.
- Estado derivado dos booleanos (`faturado`, `cancelado`, `devolvido`, `devolucao_parcial`,
  `encerrado`, `denegado`) — vira um badge de status único por prioridade (ex.: cancelado tem
  prioridade sobre "em aberto"), em vez de mostrar 6 flags soltas. **Refaturamento não entra
  aqui** — ver 4.2.1, é um caso especial.
- `obs_venda` — observação do pedido, útil pro vendedor lembrar contexto sem abrir o Omie.
- `numero_contrato` — só relevante se vier preenchido (pedido de contrato vs. spot).

**Vale considerar, mas precisa de trabalho extra:**
- **Nome do cliente** — hoje só existe `codigo_cliente` no pedido cru (nem a tela de admin
  resolve isso pra nome, é `TableCell>{row.codigo_cliente}` puro). Boa notícia: **já existe
  resolvido em outro lugar** — `detalhe_vendedor_vendas`/`detalhe_vendedor_faturamento` já
  devolvem `nome_cliente` pronto por pedido/nota. Se "Meus Pedidos" combinar as duas fontes
  (seção 4.2.1), ganha o nome de cliente de graça, sem precisar buscar em `/parceiros`.
- `etapa` — hoje é um número puro, sem dicionário de nome (mesmo gap na tela de admin). Se
  quiser nome em vez de número, precisa perguntar ao backend o que cada valor significa antes.

**Não parece útil pro vendedor:** `codigo_categoria`, `codigo_projeto` — controle interno.

### 4.2.1 Status de cada pedido — cancelado/devolvido/refaturamento

**Correção (04/09) — agora com acesso ao código-fonte real da API, não só inferência por HTTP.**
O que segue abaixo (testado ao vivo em `VendorDetailsModal.tsx`/`classificacao`) ainda descreve
corretamente o que o *frontend* faz hoje, mas eu tinha inferido o mecanismo de trás pra frente,
sem ver a fonte. Agora encontrei a peça real:

- **`vw_nf_classified`** (`GET /nf_classified`) é o motor de classificação de verdade — uma view
  que já resolve, nota a nota, o campo `grupo_deducao` numa cascata de 6 grupos: **G1 Cancelado,
  G2 Devolvido/Dev. Parcial, G3 Recusado/Denegado, G4 = destinatário casa com um termo em
  `blacklist_destinatarios`, G5 = vendedor casa com um termo em `blacklist_vendedor_g5`, G6
  Refaturamento não rastreável**, e `LIQUIDO` pra fora da dedução (a doc Swagger da rota rotula
  G4/G5 como "AV Chile"/"AV Vendedor" — provavelmente o uso típico dado a essas duas blacklists
  na prática, mas a SQL real é genérica: qualquer termo cadastrado nessas duas tabelas, não uma
  regra fixa de Chile). Aceita filtro direto por `cod_vendedor`, `data_inicio`/`data_fim`,
  `numero_pedido`, `numero_nf`.
- **`refaturamentos`** (`GET /refaturamentos`) é a tabela por trás da decisão de G6: por
  `codigo_pedido_omie`, `status_refaturamento` tem **3** valores — `Permitido`, `Proibido` e
  `Sem Referência` (não só os 2 que eu tinha inferido do frontend) — mais `motivo` (texto
  explicando a decisão, útil pra auditoria) e `periodo`.
- **Peguei a regra exata de G6 direto na SQL da view** (não é só "tem/não tem `Permitido`"):
  entra em G6 quando `obs_pedido` do pedido contém "refat"/"reaft" (texto livre, mesmo padrão
  manual que eu já tinha visto) **e** o status em `refaturamentos` **não é** `Permitido`
  (inclui `Proibido`, `Sem Referência`, e também **a ausência de registro** — sem linha em
  `refaturamentos`, o pedido é tratado como não-permitido, não como neutro). Também entra em
  G6, por um caminho independente, quando a categoria do pedido é o código `1.01.96` mesmo sem
  a palavra "refat" na observação. `Permitido` explícito é a única forma de escapar de G6 e cair
  em `LIQUIDO` — exatamente como você descreveu ("permitido fica tranquilo").
- O `classificacao`/`resolveStatus` que o modal usa (descrito abaixo) é uma leitura antiga,
  provavelmente de uma versão anterior de `detalhe_vendedor_faturamento` — o dado correto e
  atual pra "isso é refaturamento proibido ou permitido" é `grupo_deducao === 'G6'` em
  `nf_classified`, não mais parsear a primeira palavra de uma string.

**O que confirmei lendo `VendorDetailsModal.tsx` + testando ao vivo (contexto histórico, ainda
válido pros campos booleanos do pedido):**

1. **Cancelado / devolvido / devolução parcial** — vêm direto dos booleanos do pedido cru
   (`cancelado`, `devolvido`, `devolucao_parcial`), que já existem em `PedidoVendaProps`. Nada
   novo precisa, é só o badge de status já planejado acima.

2. **Refaturamento não é um campo do pedido cru** — confirmado também pela fonte real:
   `pedidos_vendas`/`nota_fiscal_saida` não têm `classificacao`/`grupo_deducao`; isso só existe
   na view agregada `nf_classified` (que junta a nota com `refaturamentos` e as outras regras de
   dedução por trás dos panos).

**O que isso muda pro portal — fonte de dado corrigida, e melhor do que eu esperava:**

- **"Minhas Notas Fiscais"**: não precisa mais casar `numero_nf` com `detalhe_vendedor_faturamento`
  (abordagem A, descartada) — chama `GET /nf_classified?cod_vendedor=<X>&data_inicio=&data_fim=`
  direto e já vem com `grupo_deducao` pronto por nota (G1..G6/LIQUIDO).

- **"Meus Pedidos"**: achei uma rota melhor ainda do que eu esperava —
  `GET /vendas_base?cod_vendedor=<X>&data_inicio=&data_fim=` (view `vw_vendas_base`, o
  equivalente de `vw_nf_classified` do lado de pedidos). Ela já devolve, por pedido, tudo que a
  seção 4.2 listava como "precisa de trabalho extra": `nome_cliente`/`razao_social_cliente`
  resolvidos (nada de `codigo_cliente` cru), `categoria` (nome, não só código), `tipo_contrato`
  já classificado, e os booleanos (`cancelado`, `devolvido`, `devolucao_parcial`, `denegado`,
  `faturado`, `encerrado`) — mais um `grupo` já calculado. Também aceita filtro direto por
  `grupo`.

  **Valores reais de `grupo` — confirmados na SQL, não é mais ponto em aberto.** A doc Swagger
  da rota diz `[G3, G4, G5, LIQUIDO]`, mas isso está desatualizado — a `CASE` real da view usa
  exatamente o mesmo desenho de `vw_nf_classified`: **G1 Cancelado, G2 Devolvido/Dev. Parcial,
  G3 Recusado/Denegado, G4 = destinatário em `blacklist_destinatarios`, G5 = vendedor em
  `blacklist_vendedor_g5`, G6 Refaturamento (mesma regra do item acima, sem checar
  `status_refaturamento` — ver ressalva no item 4 abaixo), LIQUIDO = resto.**

  **Descoberta importante sobre consolidação de família:** `vw_vendas_base` já filtra
  internamente `WHERE sequencial = 0` — ou seja, **só devolve a linha "guarda-chuva" de cada
  família de pedido**, com `total_pedido` já somado com o valor de todas as parciais
  (`soma_filhos`). Isso resolve sozinho o "ponto em aberto" da seção 4.2.2 (agrupar por
  `numero_pedido` vs. por `codigo_pedido_omie`) — o backend já entrega 1 linha por família,
  não precisa agrupar nada no frontend. **Mas atenção:** o campo `numero_nf` que a view carrega
  vem de `manifestos` (dado de scraping Playwright, não do vínculo real pedido↔nota) — não usar
  esse campo como "a nota deste pedido" na lista principal; a seção 4.2.2 já evita isso
  corretamente ao buscar as parciais e suas notas separadamente via `codigo_pedido_omie`.
  Isso elimina de vez o cruzamento manual nota↔pedido que eu tinha desenhado: "Meus Pedidos" pode
  usar `vendas_base` como fonte principal da lista (em vez de `pedidos_vendas` cru +
  `detalhe_vendedor_vendas` pro nome do cliente), com o status/refaturamento já vindo pronto.

  **Confirmado (04/09): `vendas_base` NÃO tem `data_previsao` hoje.** Conferi a CTE de origem da
  view na SQL — ela seleciona só `codigo_pedido_omie, numero_pedido, codigo_empresa, sequencial,
  etapa, data_inclusao, hora_inclusao, codigo_cliente, codigo_vendedor_omie, codigo_categoria,
  obs_venda, numero_contrato, valor_total_pedido` + os booleanos de status — `data_previsao` fica
  de fora, apesar de já existir em `pedidos_vendas` (a tabela de origem da própria CTE). Existe
  uma outra view com o campo (`vw_vendas_planilha`), mas ela não tem nenhuma rota de API — não
  dá pra usar hoje.

  **Decisão (Nathan, 04/09):** vira contrato formal pro DBA —
  `docs/portal-vendedor/contrato-data-previsao-vendas-base.md` — **✅ implementado e confirmado
  ao vivo (04/09)**. `GET /vendas_base` já devolve `data_previsao` por pedido; "Meus Pedidos" já
  usa o campo pro SLA (seção 5), sem pendência.

Isso substitui a decisão anterior de usar `detalhe_vendedor_faturamento`/parsing de
`classificacao` como fonte. Nenhum backend novo necessário — `nf_classified` e `vendas_base` já
existem e já aceitam `cod_vendedor`. **Ponto em aberto:** confirmar ao vivo os valores reais de
`grupo` em `vendas_base` (a doc da rota diverge da SQL da view) antes de codificar contra eles.

### 4.2.2 Notas fiscais de um pedido — faturamento parcial

Pedido pedido explícito do Nathan: quando um pedido é faturado, mostrar a(s) nota(s) fiscal(is)
ligada(s) a ele. Investiguei ao vivo como isso funciona de verdade, e **não é "1 pedido → N
notas"** — é outra coisa: quando um pedido é faturado em partes, o Omie cria uma **linha de
pedido nova pra cada parcial**, cada uma com seu próprio `codigo_pedido_omie`, mas todas
compartilhando o mesmo `numero_pedido` do pedido original. O campo `sequencial` (que eu tinha
descartado como "controle interno" — errado, é justamente a peça que faltava) identifica qual
parcial é qual: `0` = pedido original (o "guarda-chuva"), `1`, `2`, ... = cada parcial, na
ordem em que foi gerada.

**Caso real que encontrei** (pedido nº 27016, 3 linhas com o mesmo `numero_pedido`):

| `sequencial` | valor | faturado | NF vinculada |
|---|---|---|---|
| 0 (original) | R$ 0,00 | não | — |
| 1 (1ª parcial) | R$ 439,85 | sim | NF 00051629 |
| 2 (2ª parcial) | R$ 80,54 | sim | NF 00051711 |

Cada parcial faturada tem exatamente 1 NF (`codigo_pedido_omie` da parcial =
`codigo_pedido_omie` na nota — 1:1, confirmado em várias amostras). Isso dá o desenho da UI:

1. Ao abrir um pedido em "Meus Pedidos", busca `getPedidosVenda({ numero_pedido })` (filtro que
   **já existe** no service) — traz o original + todas as parciais.
2. Se só vier 1 linha (a maioria dos casos hoje), mostra normal, sem nenhuma seção extra.
3. Se vier mais de 1, mostra uma sub-lista "Parciais deste pedido", cada uma com seu valor,
   status e, se faturada, a nota fiscal correspondente (busca
   `getNotasFiscaisSaida({ codigo_pedido_omie: parcial.codigo_pedido_omie })` pra cada parcial
   faturada — ou faz uma chamada só com todos os `codigo_pedido_omie` das parciais e casa em
   memória, pra não disparar 1 request por parcial).

Nenhum endpoint novo — os dois filtros (`numero_pedido` em pedidos, `codigo_pedido_omie` em
notas) já existem e já funcionam ponta a ponta.

**Resolvido em parte (04/09):** `vw_vendas_base` (fonte da lista principal, seção 4.2.1) já
filtra `sequencial = 0` internamente — devolve 1 linha por família (`numero_pedido`) com o
*valor* já somado entre original + parciais. A lista principal não precisa agrupar nada pra
mostrar o total certo.

**Decisão (Nathan, 04/09) sobre o status/booleanos da família:** o `faturado`/status booleano de
`vendas_base` é só do pedido guarda-chuva (`sequencial = 0`) — no exemplo real (pedido 27016:
guarda-chuva R$ 0,00/não-faturado, 2 parciais já faturadas), esses booleanos ficam
`faturado = false` mesmo a família já tendo sido faturada nas parciais. Pra mostrar o status
agregado certo ("parcialmente faturado" etc.), a tela precisa buscar também o **`pedidos_vendas`
bruto** (não só `vendas_base`) filtrado pelo(s) `codigo_vendedor_omie` do usuário e pelo período,
trazendo todos os `sequencial` de cada família, e calcular o status agregado no frontend a partir
dos booleanos de cada parcial — não dá pra confiar só no booleano do guarda-chuva em
`vendas_base` pra isso. Na prática: `vendas_base` continua sendo a fonte de nome do
cliente/categoria/valor total/refaturamento; `pedidos_vendas` bruto (mesmo filtro de
`codigo_vendedor_omie` + período) é a fonte do status agregado por família. Duas chamadas, não
uma — mas ambas já filtradas por vendedor, mês inteiro de uma vez (não é 1 chamada por pedido).

### 4.3 Minhas Notas Fiscais

Lista de `NotasFiscaisSaidaProps`, travada nos mesmos códigos. Sem SLA (não existe campo de
prazo em nota fiscal hoje). Campos reais disponíveis:

- `numero_nf` + `data_emissao`/`hora_emissao` — a NF não tem `data_inclusao` separada como o
  pedido tem; pra nota fiscal, a emissão já é a data de criação.
- `valor_nf`, `valor_mercadorias`, `valor_ipi` — os três juntos deixam claro quanto é produto
  vs. imposto, útil pro vendedor entender a diferença entre valor do pedido e valor faturado.
- Vínculo com o pedido de origem (`codigo_pedido_omie`) — dá pra linkar a NF direto pro pedido
  correspondente em "Meus Pedidos", fechando o ciclo pedido → faturamento sem o vendedor
  precisar procurar manualmente.

**Não parece útil:** `chave_nf` (chave de acesso da NF-e — só interessa em contexto fiscal/
contador, não no dia a dia do vendedor), `manual`, `codigo_comprador_omie`. **`averbado` —
removido a pedido do Nathan**, não mostrar na tela.

**Status/classificação (cancelado, refaturamento, etc.):** correção da seção 4.2.1 — a nota
crua (`GET /nota_fiscal_saida`) não tem `grupo_deducao`, mas não precisa casar com
`detalhe_vendedor_faturamento` pra conseguir isso: `GET /nf_classified?cod_vendedor=<X>` já
devolve `grupo_deducao` pronto por nota (G1 Cancelado, G2 Devolvido, G3 Recusado, G4/G5 AV
Chile/Vendedor, G6 Refaturamento não rastreável, LIQUIDO = normal). "Minhas Notas Fiscais" pode
usar essa rota como fonte principal da lista em vez de `GET /nota_fiscal_saida` — mesmos campos
de valor (`valor_nf`, `valor_mercadorias`) mais o status já classificado, numa chamada só.

### 4.4 Filtro por período e cliente — confirmado pra v1

Decisão do Nathan: entra na v1, não fica pra depois. Nenhum backend novo — os dois filtros já
existem nos services de hoje:

- **Período (mês/ano):** reaproveita o mesmo padrão dos dashboards de admin
  (`hooks/useDashboardDate.ts`, já usado em `dash-vendas`/`dash-faturamento`) — mesmo seletor,
  mesma UX, só trocando o mês/ano nas chamadas já mapeadas (seção 6). Sem isso, "Meus Pedidos"
  ficaria preso ao mês atual, o que não ajuda quem quer ver um pedido de 2 meses atrás.
- **Cliente:** `getPedidosVenda`/`getNotasFiscaisSaida` (`services/vendas/*.ts`) já aceitam
  `codigo_cliente` como parâmetro — só falta o campo de busca na tela. Como a lista já mostra
  `nome_cliente` (resolvido via `detalhe_vendedor_*`, seção 4.2), a busca pode ser por nome
  direto no que já foi carregado, sem precisar de um novo endpoint de busca — só filtra em
  memória a lista que o vendedor já tem na tela (o volume por vendedor/mês é pequeno, não é
  como a lista de admin com milhares de registros).

Aplica-se às duas telas (Meus Pedidos e Minhas Notas Fiscais) da mesma forma.

**Seletor de mês no "Meu Dashboard" — pedido do Nathan, entra também.** Mesmo componente de
período das outras duas telas (`useDashboardDate`), recalculando todo o resumo (meta, ritmo,
faturamento, participação) pro mês escolhido — hoje o dashboard não tinha nenhum controle de
período no protótipo, ficava preso no mês atual. As três telas passam a compartilhar o mesmo
seletor de mês/ano.

---

## 5. Regra de SLA (Meus Pedidos)

Calculado em cima de `data_previsao − hoje`, só pra pedidos ainda **não faturados**
(`faturado = false`):

| Dias restantes | Estado visual |
|---|---|
| > 3 dias | Normal (sem selo) |
| = 3 dias | Vermelho sólido |
| = 2 dias | Vermelho piscando |
| = 1 dia | Vermelho piscando mais rápido + ícone de alerta (⚠️) |
| < 0 (já passou e não faturou) | **Atrasado** — estado próprio: vermelho sólido + ícone diferente (ex: 🔴 ou um selo "Atrasado"), não o mesmo visual de "1 dia" |

Pedido já faturado (`faturado = true`) não entra nessa régua — mostra normal/concluído,
independente da data.

**Cuidado de implementação:** "piscando" via CSS puro (`@keyframes` + `animation`), respeitando
`prefers-reduced-motion` (parar a animação pra quem tem essa preferência do SO/navegador) — já é
um padrão de acessibilidade que vale seguir mesmo não tendo sido pedido explicitamente.

---

## 6. Rotas Next.js novas

```
GET /api/meu-dashboard   → resolve vendedor(es) do usuário, chama dashboard_mensal_vendas
                            (e faturamento) + ranking_vendedores_vendas/_faturamento travado
                            nesses códigos
GET /api/meus-pedidos    → resolve vendedor(es), chama /vendas_base travado (seção 4.2.1),
                            agrega se houver mais de um código
GET /api/minhas-notas    → mesma lógica, /nf_classified (seção 4.2.1)
```

Todas fazem `requirePermission('meu-dashboard'|'meus-pedidos'|'minhas-notas', 'pode_visualizar')`
e resolvem o vínculo via `getServerSession` — nenhuma aceita filtro de vendedor vindo do
cliente.

---

## 7. Rollout sugerido

1. Cadastrar perfil "Vendedor" e as 3 telas/permissões (dado, via telas de admin já existentes).
2. Implementar as 3 rotas Next.js com a resolução de escopo (seção 2).
3. Implementar as 3 telas — sugiro começar por "Meus Pedidos" (é a que tem a regra mais
   complexa, SLA + status/refaturamento) e deixar "Meu Dashboard"/"Minhas Notas" pra depois, já
   que reaproveitam padrões visuais existentes (`RevenueGauge`, `VendorCard`, listagem simples).
4. Testar com um usuário de teste vinculado a um funcionário com vendedor em 2 unidades, pra
   confirmar a consolidação multi-código.
5. Só depois, criar de fato os usuários dos vendedores reais e vinculá-los ao perfil.

**Status (04/09):** vínculo, escopo, resumo do topo, refaturamento (vendas e faturamento), meta
individual, filtro por período/cliente e SLA (`data_previsao`) estão fechados — **os 3 contratos
do DBA (`001`, `002`, `003`) foram implementados e confirmados ao vivo**. Restam 2 pendências,
nenhuma bloqueada em backend:

1. **Dicionário de `etapa`** — em andamento (Nathan).
2. **Status agregado da família de pedido** (seção 4.2.2) — decisão já tomada (buscar
   `pedidos_vendas` bruto além de `vendas_base`), só falta implementar.

Pré-requisito de dado (não bloqueio de plano): confirmar quantos vendedores reais já têm
`id_funcionario` preenchido antes de anunciar a feature para eles.

**Extras agora liberados** (contratos `002`/`003` implementados) — nenhum construído no frontend
ainda: top clientes do vendedor (8.5), clientes inativos (8.9), favoritar cliente/pedido (8.10),
histórico de status do pedido (8.11).

---

## 8. Extras — validados, aguardando decisão de escopo

Lista de melhorias levantada em conversa, com a viabilidade técnica de cada uma checada contra
o que já existe (nenhuma virou decisão de escopo ainda — só validação).

### 8.1 Estados vazios e de erro (Meu Dashboard, Meus Pedidos, Minhas Notas)

✅ Viável, puro frontend. Nenhuma das 3 telas do protótipo trata "sem pedido nenhum no mês" ou
"a chamada falhou" — hoje só existe o caso "cheio". Precisa de 1 estado vazio + 1 estado de
erro por tela (6 ao todo, mas reaproveitando um componente genérico).

### 8.2 Badge de alerta no menu lateral (contagem de pedidos em SLA crítico)

✅ Viável, sem endpoint novo — mesma lista de "Meus Pedidos" filtrada por `data_previsao` ≤ 2
dias e `faturado = false`, só que contada, não listada. **Ressalva de arquitetura:** pra
aparecer no menu (`components/Layout/AppLayout/Menu/Menu.tsx`), essa contagem precisa ser
buscada em toda navegação do usuário vendedor, não só quando ele abre "Meus Pedidos" — é um
component novo no layout compartilhado, não só na tela. Vale um cache curto (poucos minutos)
pra não bater a API a cada troca de página.

### 8.3 Comparação com o mês anterior (Meu Dashboard)

✅ Viável, sem endpoint novo. `ranking_vendedores_vendas`/`_faturamento` não trazem o mês
anterior na mesma linha — mas como "Meu Dashboard" já busca esse ranking pro mês escolhido
(seção 4.1), basta uma segunda chamada com `mes-1` e comparar `vendas`/`valor_total` entre as
duas. Duas chamadas em vez de uma, não é grátis, mas não pede nada novo ao backend.

### 8.4 "Próximos vencimentos" ranqueado (Meu Dashboard)

✅ Viável, sem endpoint novo. Mesmos dados de "Meus Pedidos" (`data_previsao`, `faturado`),
só que ordenados por `data_previsao` ascendente e cortados nos top 3-5, exibidos como uma lista
compacta no Dashboard em vez de ir até a tela cheia.

### 8.5 Top clientes do vendedor no mês

⚠️ Viável, mas não do jeito óbvio. `ranking_clientes_vendas` (o endpoint de ranking de clientes
que já existe) **não filtra por vendedor** — só por `codigo_empresa`/`cliente`/`cpf_cnpj`,
então rankeia clientes da empresa inteira, não do vendedor. A forma de fazer isso sem pedir
endpoint novo: `detalhe_vendedor_vendas` (já usado pro resumo e pra achar refaturamento, seções
4.1 e 4.2.1) já devolve `nome_cliente` + `valor_pedido` por pedido do vendedor — agrupar esses
pedidos por cliente e somar o valor, no frontend, dá o ranking pessoal. É uma agregação sobre
um conjunto pequeno e já corretamente filtrado (os pedidos do próprio vendedor no mês), não um
cálculo que deveria ser do backend escondido no cliente.

### 8.6 Copiar nº do pedido/nota com 1 clique

✅ Viável, zero dependência de dado — `navigator.clipboard.writeText`, padrão de acessibilidade
(foco visível, `aria-label` "Copiar número").

### 8.7 "Dados atualizados às HH:MM"

⚠️ Viável, mas com uma ressalva importante de honestidade: **não existe, em nenhum endpoint
hoje, um timestamp de "última sincronização com o Omie"** — só `updated_at` por registro
individual (quando aquela linha específica mudou). Mostrar a hora em que a página carregou
seria enganoso (parece "dado fresco" mas só significa "a página abriu agora"). A versão honesta
é pegar o `updated_at` **mais recente entre os registros carregados** — aí é uma leitura real
do dado, não do relógio do navegador. Se quiser um "sincronizado com o Omie às HH:MM" de
verdade, isso vira pedido de backend (não existe hoje).

### 8.8 Exportar "Meus Pedidos"/"Minhas Notas" (CSV/Excel)

✅ Viável, puro frontend. Gera o arquivo a partir do que já está carregado na tela (mesma lista
que já foi buscada pra exibir) — não precisa de endpoint de exportação, é só formatar e baixar.

### 8.9 Cliente inativo (sem comprar há X dias)

⚠️ Viável, mas caro do jeito que os endpoints existem hoje. Todos são recortados por
`mes`/`ano` — não existe um "me diga a última compra de cada cliente" direto. Pra descobrir
isso precisaria buscar vários meses pra trás (quantos, depende de quão "inativo" precisa estar
pra contar) e achar a data mais recente por cliente entre todas as chamadas — funciona, mas é N
chamadas em vez de 1, não é imediato. Um endpoint dedicado tipo "última compra por cliente"
resolveria isso de forma mais barata, mas não é bloqueio pra tentar do jeito caro primeiro.

### 8.10 Favoritar cliente ou pedido

⚠️ Viável, mas só localmente sem tabela nova. Guardar em `localStorage` do navegador resolve
pro dia a dia, mas não sincroniza entre o computador do escritório e o celular do vendedor, por
exemplo, e some se ele limpar os dados do navegador. Pra sincronizar de verdade entre
dispositivos, precisaria de uma tabelinha nova (`usuarios_favoritos` ou parecido) — contrato de
backend pequeno, mas contrato mesmo assim.

### 8.11 Histórico de status do pedido

⚠️ Parcial. Não existe um log de toda mudança de status (ex.: "voltou de cancelado pra
pendente" não fica registrado em lugar nenhum) — mas dá pra montar uma mini-linha do tempo
**com o que já existe**, porque `PedidoVendaProps` já guarda a data de cada marco importante:
`data_inclusao` → `data_previsao` → (`data_faturamento` OU `data_cancelamento` OU
`data_encerramento`, o que tiver preenchido). Isso cobre o caminho normal de um pedido, só não
captura idas e vindas fora do fluxo esperado.

### 8.12 Top produtos vendidos (ranking pessoal)

✅ **Correção (04/09):** o veredito anterior (❌) foi tirado só de procurar no código do av-hub
— não existe mesmo campo de produto/item em `PedidoVendaProps`/`NotasFiscaisSaidaProps`. Mas com
acesso ao código-fonte real da API (`api-acos-vital-main`), existe uma view dedicada:
`core_vendas_faturamento.vw_pedido_venda_itens`, exposta via `GET /pedido_venda_itens` (lista
plana, paginada, filtra por `codigo_vendedor_omie`, `data_inicio`/`data_fim`, `codigo_produto`,
etc.) e `GET /pedido_venda_itens/{numero_pedido}` (produtos aninhados por pedido). Cada linha já
traz `codigo_produto`, `descricao`, `quantidade`, `valor_unitario`, `valor_total`, `ncm`, `cfop`.
Dá pra montar "meus produtos mais vendidos" agregando essa rota no frontend (buscar as páginas
do mês filtradas pelo `codigo_vendedor_omie` e somar por produto) sem pedir nada novo ao
backend — só vira pedido de backend (endpoint de agregação `GET /ranking_produtos_vendas`) se o
volume de itens por mês tornar a agregação client-side pesada demais na prática.

### 8.13 Ritmo de meta por semana

✅ Viável, sem endpoint novo. `ritmo_meta_vendas` só dá o ritmo diário do mês inteiro — mas como
"Meus Pedidos" já precisa buscar os pedidos do mês (pro SLA e pras listas), dá pra agrupar esses
mesmos pedidos por semana ISO e comparar com uma fração proporcional da meta mensal. É uma
aproximação (a meta "ideal por semana" é dividida, não uma meta semanal de verdade vinda do
backend), mas dá a noção de ritmo dentro do mês sem esperar o mês fechar.

### 8.14 Filtro por status (só cancelados, só faturados, só em aberto)

✅ Viável — o mais simples de todos. `situacao` já é parâmetro aceito em `getPedidosVenda`
(`services/vendas/pedidosVenda.ts`) — só falta o controle na tela pra escolher o valor.

### 8.15 SLA agregado por cliente

✅ Viável, sem endpoint novo. Mesma lista de "Meus Pedidos" (já filtrada pro vendedor e pro
mês) — agrupa por cliente, conta quantos pedidos daquele cliente estão em atraso (`data_previsao`
passada e `faturado = false`). Reaproveita dado que já estaria na tela, só muda a visualização
de lista pra agrupado.
