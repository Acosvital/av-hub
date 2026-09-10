# Bug de backend — `vw_faturamento_planilha_resumo` conta NFs órfãs (sem pedido) que `vw_nf_classified` corretamente exclui

**Criado em:** 09/09/2026, a partir do Portal do Gerente (`/notas-equipe` e `/dashboard-equipe`),
mês de referência setembro/2026 — o card "Total faturado" do Dashboard da Equipe mostrava
R$ 1.856.861,48, enquanto o resumo (waterfall) da tela Notas da Equipe mostrava
R$ 3.148.554,09 pro mesmo mês. Nathan confirmou por fonte externa (Omie) que o valor correto
está na faixa de **R$ 3.148.554,09 a R$ 3.497.973,83** — ou seja, **o Dashboard da Equipe está
errado**, não a tela nova.

**Status:** **confirmado no código-fonte das duas views** (Nathan mandou o dump completo do
banco de produção, `dump-avhub_prd_db-202609090728.sql`, gerado 09/09/2026 07:28). Não é bug no
frontend do av-hub, e não é mais só uma hipótese por comparação de API — a causa é uma diferença
de **uma condição só** entre as duas views, com a linha exata identificada abaixo (seção 2.1).

---

## 1. As duas fontes que divergem

| Tela | Endpoint | View/função por trás (pela doc do swagger) |
|---|---|---|
| Dashboard da Equipe → "Total faturado" | `GET /dashboard_mensal_faturamento` | `core_vendas_faturamento.fn_dashboard_mensal_faturamento(...)`, que documenta usar **`vw_nf_classified`**, `grupo_deducao = 'LIQUIDO'` |
| Notas da Equipe → resumo (waterfall) | `GET /faturamento_planilha_resumo` | `vw_faturamento_planilha_resumo`, construída sobre **`vw_faturamento_planilha`** — doc diz aplicar "os mesmos filtros estruturais de vw_nf_classified (deleted_at, tipo_nf = '1', valor ajustado > 0, **pedido existente ou NF manual**, blacklist_vendedores)" |

Ou seja: por design, as duas deveriam bater. Na prática, setembro/2026 (mês **ainda aberto**,
então não é questão de `is_track_record`/mês fechado):

| Métrica | `dashboard_mensal_faturamento` | `faturamento_planilha_resumo` |
|---|---|---|
| Consolidado (2 empresas) | R$ 1.856.861,48 (146 NFs) | R$ 3.148.554,09 líquido (227 NFs bruto) |
| Empresa satélite (`4ec9f957-...`) | R$ 83.827,65 (3 NFs) | R$ 83.827,65 (3 NFs) ✅ **bate exato** |
| Empresa grande (`759979bd-...`) | R$ 1.773.033,83 (143 NFs) | R$ 3.064.726,44 líquido (224 NFs bruto) ❌ |

A empresa satélite bate **perfeitamente** (não tem nenhuma dedução naquele mês) — o que já
isola o problema: a lógica de dedução em si funciona igual nas duas views; a diferença está em
**quais NFs entram no "bruto"** da empresa grande.

## 2. Causa raiz

### 2.1 A linha exata do bug

Via API (antes de ter o dump), isolei via diff que **65 NFs** de setembro/2026, empresa
`759979bd-...`, aparecem em `vw_faturamento_planilha` (entram no bruto/líquido de
`vw_faturamento_planilha_resumo`) mas não em `vw_nf_classified` (por isso não entram no
`dashboard_mensal_faturamento`). Todas as 65 têm o mesmo padrão: `tipo_nf = '1'`,
`codigo_pedido_omie` preenchido, mas **`pedido` (numero_pedido) e `vendedor` nulos** — ou seja,
a NF referencia um pedido que não foi encontrado.

Com o dump, confirmei a causa exata comparando as duas definições de view
(`pg_dump --schema-only`, schema `core_vendas_faturamento`):

**`vw_nf_classified`** (linhas 7525-7526 do dump) faz `LEFT JOIN pv_src pv ON (pv.codigo_pedido_omie = a.codigo_pedido_omie AND ...)`
e depois filtra por **`pv.codigo_pedido_omie IS NOT NULL`** — ou seja, checa a coluna vinda do
JOIN contra `pedidos_vendas`. Se não existe pedido com aquele código, o JOIN não encontra nada,
`pv.codigo_pedido_omie` vem `NULL` (é `LEFT JOIN`), e a NF é corretamente excluída (a menos que
seja manual).

**`vw_faturamento_planilha_resumo`** (linha 7262 do dump), que roda sobre a CTE `nf` (que por
sua vez é uma cópia de `vw_faturamento_planilha`), filtra por **`f.codigo_pedido_omie IS NOT NULL`**
— só que aqui `codigo_pedido_omie` é a coluna **crua da própria NF** (`n.codigo_pedido_omie` em
`vw_faturamento_planilha`, linha 7138 do dump — vem de `notas_fiscais`, não do `LEFT JOIN` contra
`pedidos_vendas`). Essa coluna vem preenchida pela Omie na própria nota fiscal, **independente**
de existir ou não um pedido correspondente na tabela `pedidos_vendas`. Por isso o filtro nunca
exclui NF nenhuma por "pedido inexistente" — só excluiria se o campo na NF viesse null, o que
quase nunca acontece.

Em suma: as duas views implementam a mesma regra ("pedido existente ou NF manual") checando
colunas com o mesmo nome, mas de origens diferentes — uma vem do JOIN (correto), a outra vem da
tabela de origem antes do JOIN (sempre preenchida, não prova que o pedido existe).

### 2.2 Prova direta no dump: o pedido genuinely não existe

Uma das 65 NFs, como exemplo (linha 179115 do dump, tabela `notas_fiscais`):

```
numero_nf = 00051937, codigo_pedido_omie = 10461582216, valor_nf = 819.60,
codigo_empresa = 759979bd-2b2d-41f2-b1b7-db6fae89ee59
```

`grep -c "10461582216"` no dump inteiro (67 MB, todas as tabelas, `notas_fiscais`,
`hst_notas_fiscais`, `pedidos_vendas`, `hst_pedidos_vendas` incluídas) → **1 ocorrência só**,
exatamente essa linha em `notas_fiscais`. Esse `codigo_pedido_omie` não existe em
`pedidos_vendas` nem em `hst_pedidos_vendas` — confirma que não é atraso de sincronização
recuperável por um reprocessamento simples, o pedido realmente nunca foi gravado (ou foi
apagado sem cascatear pra NF).

Soma do `total_nota_fiscal_ajustado` das 65 NFs órfãs: **R$ 1.561.361,23** — na mesma ordem de
grandeza da diferença observada (R$ 1.291.692,61 na empresa grande; a diferença entre os dois
números é porque algumas dessas 65 NFs também caem em linhas de dedução na `_resumo`, não só no
bruto).

### 2.3 A correção (uma linha)

Em `vw_faturamento_planilha_resumo`, trocar a condição da CTE `nf` de:

```sql
((f.codigo_pedido_omie IS NOT NULL) OR f.manual_nf)
```

para usar a coluna que só vem preenchida quando o `LEFT JOIN` contra `pedidos_vendas` realmente
encontrou o pedido — em `vw_faturamento_planilha` essa coluna já existe e se chama `pedido`
(`pv.numero_pedido AS pedido`, linha 7127 do dump):

```sql
((f.pedido IS NOT NULL) OR f.manual_nf)
```

Isso replica exatamente a lógica de `vw_nf_classified` (que usa `pv.codigo_pedido_omie IS NOT NULL`,
a coluna pós-JOIN) sem precisar refazer o JOIN dentro da `_resumo`.

## 3. Vendas/Pedidos — mesma suspeita, ainda não confirmada (setembro bate, agosto não)

Fizemos o mesmo tipo de checagem no lado de Vendas:

- **Setembro/2026 (mês aberto): bate exato** — `dashboard_mensal_vendas.vendas_total` =
  `vendas_planilha_resumo` "Vendas Líquidas" = **R$ 12.641.630,63** nos dois.
- **Agosto/2026 (mês fechado): não bate** — `dashboard_mensal_vendas` = R$ 29.224.863,42,
  `vendas_planilha_resumo` = R$ 19.183.283,46 (líquido) ou R$ 20.145.347,60 (bruto).
- Testamos `is_track_record=true` pra agosto nos dois endpoints — **não resolve**: `vendas_base`
  com `is_track_record=false` (padrão) já bate exatamente com `dashboard_mensal_vendas` pra
  agosto (R$ 29.224.863,42 nos dois), então não é questão de mês fechado/histórico.
- Uma comparação direta `vendas_planilha` vs `vendas_base` fica mais complicada de isolar porque
  `vendas_planilha` é a view CRUA por sequencial/parcial (múltiplas linhas por pedido — ver
  `docs/portal-vendedor/` sobre isso), então uma simples contagem de linhas não é comparável
  direto como foi possível com as NFs (nf_classified e faturamento_planilha são 1 linha por NF
  nos dois lados). **Recomendamos que o time de backend aplique a mesma metodologia da seção 4**
  (join por `codigo_pedido_omie`, olhando se existe ou não em `pedidos_vendas`) do lado de
  vendas também, pra confirmar se é o mesmo tipo de gap de sincronização.

## 4. SQL pro DBA confirmar e aplicar

```sql
-- 1) Confirma a lista completa de NFs órfãs (mesmo critério da view, mas explícito) —
--    deve bater com as 65 da empresa grande em setembro/2026.
SELECT
  nf.numero_nf,
  nf.codigo_pedido_omie,
  nf.valor_nf,
  nf.data_emissao
FROM core_vendas_faturamento.notas_fiscais nf
LEFT JOIN core_vendas_faturamento.pedidos_vendas pv
  ON pv.codigo_pedido_omie = nf.codigo_pedido_omie
 AND pv.codigo_empresa = nf.codigo_empresa
WHERE nf.data_emissao BETWEEN '2026-09-01' AND '2026-09-30'
  AND nf.codigo_empresa = '759979bd-2b2d-41f2-b1b7-db6fae89ee59'
  AND nf.tipo_nf = '1'
  AND nf.deleted_at IS NULL
  AND COALESCE(nf.manual, false) = false
  AND pv.codigo_pedido_omie IS NULL      -- pedido não existe (nem em pedidos_vendas nem hst_)
  AND nf.codigo_pedido_omie IS NOT NULL; -- mas a NF referencia um codigo_pedido_omie

-- 2) A correção proposta (ver seção 2.3) — trocar em vw_faturamento_planilha_resumo,
--    dentro da CTE `nf`, a condição:
--      ((f.codigo_pedido_omie IS NOT NULL) OR f.manual_nf)
--    por:
--      ((f.pedido IS NOT NULL) OR f.manual_nf)
--    `f.pedido` já existe na view (= pv.numero_pedido do LEFT JOIN) e só vem preenchido
--    quando o pedido realmente existe em pedidos_vendas/hst_pedidos_vendas.

-- 3) Depois de aplicar, validar que bate com vw_nf_classified pro mesmo recorte:
SELECT tipo, SUM(valor), SUM(qtd_nfs)
FROM core_vendas_faturamento.vw_faturamento_planilha_resumo
WHERE codigo_empresa = '759979bd-2b2d-41f2-b1b7-db6fae89ee59'
  AND mes = '2026-09-01' AND is_track_record = false
GROUP BY tipo;
-- Esperado após o fix: "bruto" com 159 NFs (não mais 224), líquido = R$ 1.773.033,83
-- (bate com dashboard_mensal_faturamento pra essa empresa/mês).
```

## 5. O que precisa mudar (backend)

1. **Aplicar a correção da seção 2.3/4** em `vw_faturamento_planilha_resumo` — é uma troca de
   coluna numa condição só. Isso deve fazer `faturamento_planilha_resumo` bater com
   `dashboard_mensal_faturamento` nos meses abertos (setembro validado nesta investigação).
2. **Raiz do gap de dados:** por que essas ~65 NFs de setembro têm `codigo_pedido_omie`
   preenchido mas nenhum pedido correspondente foi sincronizado (confirmado ausente em
   `pedidos_vendas` e `hst_pedidos_vendas` no dump)? Vale confirmar com quem mantém a pipeline
   Omie→banco (mesma área do bug de `loadWorker.ts`/`conflictWhere` corrigido nesta mesma sessão)
   se é um gap de sincronização (pedido nunca chegou) ou uma condição de corrida (NF sincroniza
   antes do pedido, numa janela específica).
3. **Vendas/Pedidos (seção 3):** aplicar a mesma investigação pra agosto/2026 — comparar
   `vw_vendas_base` (fonte do dashboard) com `vw_vendas_planilha`/`vw_vendas_planilha_resumo` da
   mesma forma (via dump, procurando por uma diferença de coluna pré-JOIN vs pós-JOIN parecida),
   já que ali a divergência também existe e ainda não tem causa confirmada.

## 6. Contrato de API — chamadas usadas nesta investigação (pra reproduzir)

Todas contra `https://api.acosvital.com.br`, header `x-api-key`.

| Propósito | Chamada |
|---|---|
| Dashboard consolidado de faturamento (setembro) | `GET /dashboard_mensal_faturamento?mes=9&ano=2026` |
| Dashboard consolidado de vendas (agosto) | `GET /dashboard_mensal_vendas?mes=8&ano=2026` |
| Resumo/waterfall de faturamento (setembro, 1 empresa) | `GET /faturamento_planilha_resumo?mes=9&ano=2026&codigo_empresa=759979bd-2b2d-41f2-b1b7-db6fae89ee59` |
| Resumo/waterfall de vendas (agosto, sem empresa — soma por unidade, não consolida sozinho) | `GET /vendas_planilha_resumo?mes=8&ano=2026` |
| NFs classificadas, pro período (não aceita `mes`/`ano` nem `codigo_empresa` — só `data_inicio`/`data_fim`, filtrar empresa no array de retorno) | `GET /nf_classified?data_inicio=2026-09-01&data_fim=2026-09-30` |
| NFs cruas, pro período e empresa | `GET /faturamento_planilha?data_inicio=2026-09-01&data_fim=2026-09-30&codigo_empresa=759979bd-2b2d-41f2-b1b7-db6fae89ee59&limit=2000` |
| Confirma que o pedido de uma NF órfã não existe | `GET /vendas_planilha?codigo_pedido_omie=10461582216&com_deletados=true` → `total: 0` |

**Atenção pro time de backend:** `/nf_classified` e `/vendas_base` **não têm** atalho
`mes`/`ano` nem filtro `codigo_empresa` (só `/vendas_planilha`, `/faturamento_planilha` e as
`_resumo` têm) — isso já pegou esta investigação de surpresa (uma primeira tentativa com
`mes=9&codigo_empresa=...` no `/nf_classified` foi ignorada silenciosamente e devolveu histórico
inteiro sem filtrar). Se fizer sentido, path de melhoria futura (não bloqueia esta investigação):
padronizar esses parâmetros entre as views antigas e as novas.
