# Pedido de melhoria — expor `grupo` (G1-G6) filtrável em `vw_faturamento_planilha` e `vw_vendas_planilha`

**Criado em:** 09/09/2026, a partir do Portal do Gerente (`/notas-equipe` e `/pedidos-equipe`).

**Não é bug — é uma melhoria de API.** O quadro "Composição do Faturamento/Vendas do mês
(Bruto → Deduções → Líquido)" que já existe nessas duas telas tem 7 linhas de dedução
(Cancelado, Devolvido, Devolvido parcialmente, Recusado, Aços Vital Chile, Aços Vital
Vendedor, Refaturamento). Queremos deixar cada linha clicável, filtrando a lista de
notas/pedidos logo abaixo para mostrar exatamente os registros daquela categoria — hoje
isso só é possível pra 4 das 7.

---

## 1. O que já funciona (4 de 7 categorias)

`GET /faturamento_planilha` e `GET /vendas_planilha` já aceitam os booleanos do
pedido/nota como filtro (`cancelado`, `devolvido`, `devolucao_parcial`, `denegado` — ver
`src/routes/vw_faturamento_planilha.js` linhas 200-213 e `vw_vendas_planilha.js` linhas
296-303). Isso cobre exatamente os grupos **G1, G2, G2P e G3**. Já implementamos e testamos
essa parte no frontend (`app/(protected)/notas-equipe/page.tsx` e
`app/(protected)/pedidos-equipe/page.tsx`, mapeamento `GRUPO_PARA_FILTRO`).

## 2. O que falta (3 de 7 categorias) — e por que não dá pra resolver no frontend

- **G4 "Aços Vital Chile"** — uma nota/pedido cai em G4 quando o destinatário casa (regex,
  `unaccent` + `ILIKE`) com algum termo cadastrado em `blacklist_destinatarios` (com
  `escopo` = `faturamento`/`vendas`/`ambos`). Essa tabela não é exposta por nenhum endpoint
  hoje — o frontend não tem como saber quais termos estão cadastrados nem reproduzir o match.
- **G5 "Aços Vital Vendedor"** — mesma mecânica, contra `blacklist_vendedor_g5` (por
  vendedor, não por destinatário). Mesma tabela não exposta.
- **G6 "Refaturamento"** — não é um campo simples. A regra real (extraída do SQL abaixo) é:
  `obs_pedido` contém "refat"/"reaft" **e** o status em `refaturamentos` não é `Permitido`
  (inclui `Proibido`, `Sem Referência` e a ausência de registro) — **ou**, por um caminho
  independente, a categoria do pedido é `1.01.96` mesmo sem a palavra "refat" na observação.
  `/faturamento_planilha` até aceita `status_refaturamento` como filtro, mas sozinho ele não
  reproduz a regra (um pedido com `Proibido` mas sem "refat" na observação e categoria
  diferente de `1.01.96` não é G6, por exemplo).

Reimplementar isso no frontend duplicaria regra de negócio de forma frágil — se o backend
mudar a lógica de classificação (o que já aconteceu: a `_resumo` tem G2P separado, que
`vw_nf_classified`/`vw_vendas_base` não têm), o frontend fica errado silenciosamente, sem
nenhum aviso. Mais seguro pedir pro banco, já que a lógica **já existe e já está validada**
(seção 3).

## 3. A classificação já existe — só que agregada, não por registro

`vw_faturamento_planilha_resumo` e `vw_vendas_planilha_resumo` já calculam esse `grupo`
**por nota/pedido**, numa CTE interna (`classificada`), antes de agregar em 10 linhas por
mês. Elas só não expõem essa classificação por registro — só o agregado. CASE exato (extraído
de `pg_dump --schema-only`, `dump-avhub_prd_db-202609090917.sql`):

**Faturamento** (linhas 7271-7286 do dump, dentro de `vw_faturamento_planilha_resumo`):
```sql
CASE
    WHEN (COALESCE(n.manual_nf, false) OR COALESCE(n.manual_pedido, false)) THEN 'LIQUIDO'
    WHEN n.cancelado THEN 'G1'
    WHEN n.devolvido THEN 'G2'
    WHEN n.devolucao_parcial THEN 'G2P'
    WHEN (n.denegado OR (unaccent(upper(COALESCE(n.manifestacao_destinatario, ''))) ~ 'DESCONHEC|NAO REALIZ')) THEN 'G3'
    WHEN EXISTS (
        SELECT 1 FROM core_vendas_faturamento.blacklist_destinatarios bd
        WHERE bd.deleted_at IS NULL
          AND bd.escopo = ANY (ARRAY['faturamento','ambos'])
          AND unaccent(COALESCE(n.nome_fantasia_destinatario,'') || ' ' || COALESCE(n.destinatario,'')) ~* unaccent(bd.termo)
    ) THEN 'G4'
    WHEN EXISTS (
        SELECT 1 FROM core_vendas_faturamento.blacklist_vendedor_g5 bv5
        WHERE bv5.deleted_at IS NULL
          AND bv5.escopo = ANY (ARRAY['faturamento','ambos'])
          AND unaccent(COALESCE(n.vendedor,'')) ~* unaccent(bv5.termo)
    ) THEN 'G5'
    WHEN (n.obs_pedido ~* 'refat|reaft' AND (n.status_refaturamento IS NULL OR n.status_refaturamento = ANY (ARRAY['Proibido','Sem Referência']))) THEN 'G6'
    WHEN ((n.obs_pedido IS NULL OR n.obs_pedido !~* 'refat|reaft') AND n.codigo_categoria_pedido = '1.01.96') THEN 'G6'
    ELSE 'LIQUIDO'
END AS grupo
```

**Vendas** (linhas 8013-8028 do dump, dentro de `vw_vendas_planilha_resumo`) — mesma regra,
adaptada pros campos de pedido (usa `razao_social_destinatario` em vez de
`nome_fantasia_destinatario`, e um `LEFT JOIN` explícito contra `refaturamentos` em vez de
`status_refaturamento` já vir na nota):
```sql
CASE
    WHEN p.manual THEN 'LIQUIDO'
    WHEN p.cancelado THEN 'G1'
    WHEN p.devolvido THEN 'G2'
    WHEN p.devolucao_parcial THEN 'G2P'
    WHEN (p.denegado OR (unaccent(upper(COALESCE(p.manifestacao_destinatario,''))) ~ 'DESCONHEC|NAO REALIZ')) THEN 'G3'
    WHEN EXISTS (
        SELECT 1 FROM core_vendas_faturamento.blacklist_destinatarios bd
        WHERE bd.deleted_at IS NULL
          AND bd.escopo = ANY (ARRAY['vendas','ambos'])
          AND unaccent(COALESCE(p.destinatario,'') || ' ' || COALESCE(p.razao_social_destinatario,'')) ~* unaccent(bd.termo)
    ) THEN 'G4'
    WHEN EXISTS (
        SELECT 1 FROM core_vendas_faturamento.blacklist_vendedor_g5 bv5
        WHERE bv5.deleted_at IS NULL
          AND bv5.escopo = ANY (ARRAY['vendas','ambos'])
          AND unaccent(COALESCE(p.vendedor,'')) ~* unaccent(bv5.termo)
    ) THEN 'G5'
    WHEN (p.obs_pedido ~* 'refat|reaft' AND (rf.status_refaturamento IS NULL OR rf.status_refaturamento = ANY (ARRAY['Proibido','Sem Referência']))) THEN 'G6'
    WHEN ((p.obs_pedido IS NULL OR p.obs_pedido !~* 'refat|reaft') AND p.codigo_categoria = '1.01.96') THEN 'G6'
    ELSE 'LIQUIDO'
END AS grupo
-- rf = LEFT JOIN core_vendas_faturamento.refaturamentos rf
--        ON rf.codigo_pedido_omie = p.codigo_pedido_omie AND rf.codigo_empresa = p.codigo_empresa
```

**Atenção (só do lado de vendas):** essa CTE classifica por **família** de pedido
(`WHERE COALESCE(p.sequencial, 0) = 0`, valor = soma de todos os sequenciais). `vw_vendas_planilha`
crua devolve 1 linha por sequencial (não só o cabeçalho). Se o `grupo` for adicionado direto
nela, o mais simples é repetir o `grupo` calculado da família em todas as linhas da mesma
`pedido_venda` (a tela de Pedidos da Equipe já agrupa sequenciais no frontend por família —
`utils/agruparPedidosPlanilha.ts` —, então um valor repetido não quebra nada).

## 4. Não confundir com o que já existe em `vw_nf_classified`/`vw_vendas_base`

Essas duas views (`GET /nf_classified`, `GET /vendas_base`) **já** têm uma coluna de grupo
filtrável (`grupo_deducao` / `grupo`) — mas com um esquema **diferente e mais antigo**:
`vw_nf_classified` usa `[G1..G6, LIQUIDO]` só que sem separar G2P, e `vw_vendas_base` usa
`[G3, G4, G5, LIQUIDO]` (uma classificação totalmente distinta, onde G4 já combina
Cancelado+Denegado+Devolvido). Nenhuma das duas bate com as 7 linhas do quadro que a tela
mostra — por isso não dá pra só trocar `/faturamento_planilha`/`/vendas_planilha` por essas
rotas "prontas", precisa ser a MESMA classificação da `_resumo` (seção 3).

## 5. Pedido concreto

1. Adicionar uma coluna computada `grupo` (mesmo CASE da seção 3, valores
   `G1|G2|G2P|G3|G4|G5|G6|NULL` — `NULL` = líquido) em `vw_faturamento_planilha` e
   `vw_vendas_planilha` (ou numa view intermediária nova, se preferirem não alterar a
   "view crua" por design — o nome não importa, só precisamos de uma rota que devolva a
   lista de registros já com esse campo).
2. Aceitar `?grupo=G1|G2|G2P|G3|G4|G5|G6` em `GET /faturamento_planilha` e
   `GET /vendas_planilha` — mesmo enum e mesmo padrão que já existe em
   `GET /faturamento_planilha_resumo` / `GET /vendas_planilha_resumo`
   (`src/routes/vw_faturamento_planilha_resumo.js` linhas 104-106).

Isso não bloqueia nada do que já está em produção — as 4 categorias que já funcionam
continuam do jeito que estão. É estritamente uma adição.

## 6. Onde isso vai ser usado no frontend

- `app/(protected)/notas-equipe/page.tsx` — mapeamento `GRUPO_PARA_FILTRO` (hoje só G1-G3),
  view `resumoPlanilha` renderizada logo acima da lista de notas.
- `app/(protected)/pedidos-equipe/page.tsx` — mesmo padrão, mesma constante, view de pedidos.

Assim que `grupo` existir e for filtrável nas rotas cruas, é só estender o mapeamento pra
incluir G4/G5/G6 e trocar o parâmetro enviado pro backend de volta pro flag booleano — não
precisa de nenhuma outra mudança de UI, o clique/toggle/scroll já está implementado.
