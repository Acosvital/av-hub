# Contrato — Cor por Unidade + participação no gauge (Dashboards)

**Objetivo:** permitir cadastrar uma cor de identificação por unidade e usá-la num anel
de participação por unidade nos dashboards de Vendas e Faturamento (abaixo do gauge
principal), mostrando quanto cada unidade equivale do total. Segue o mesmo padrão já
usado em `core.setores.cor_setor`.

**Situação atual:** `core.unidades` não tem coluna de cor — `UnidadeProps` (tipo do
frontend, `app/(protected)/cadastros/auxiliares/unidades/types.ts`) não expõe nenhum
campo desse tipo hoje. Sem isso, não há como diferenciar unidades visualmente sem uma
paleta fixa no código, que quebra visualmente cada vez que uma unidade nova é cadastrada.

Este documento tem duas partes independentes: a cor (item 1–2) e o dado de participação
por unidade que o anel precisa pra existir (item 3), que não é sobre cor nenhuma — é
sobre o gauge hoje só devolver o total da unidade já filtrada, não a fatia de cada uma.

---

## 1. Banco de dados

### 1.1 Nova coluna: `core.unidades.cor_unidade`

```sql
ALTER TABLE core.unidades ADD COLUMN cor_unidade varchar(7) NULL;
```

Mesmo padrão de `core.setores.cor_setor`: string hex `#RRGGBB`, sem tabela nem enum
separado. `NULL` por padrão — unidade sem cor cadastrada cai num fallback visual no
frontend (cinza neutro). Retrocompatível: nenhuma unidade existente precisa de
migração de dado pra continuar funcionando.

---

## 2. API (api-acos-vital)

### 2.1 Repasse do campo

`GET/POST/PUT /unidades` já devolvem/aceitam o objeto de unidade inteiro — não é
necessário endpoint novo, só incluir `cor_unidade` no SELECT/INSERT/UPDATE de
`unidades` no backend.

As rotas Next.js (`app/api/unidades/route.ts` e `app/api/unidades/[id]/route.ts`) já
repassam o corpo da requisição sem transformá-lo (`POST`/`PUT` fazem
`JSON.stringify(body)` direto, e o `GET` faz spread do objeto retornado) — então o
campo passa a fluir automaticamente assim que existir na tabela e no backend, sem
nenhuma mudança de código no Next.js.

---

## 3. Segunda necessidade — participação por unidade no período do gauge

A cor sozinha não é suficiente pra desenhar o anel: hoje os endpoints consumidos por
`getVendaMensal`/`getFaturamentoMensal` (`services/dashboards/dashboardVendas.ts` /
`dashboardFaturamento.ts`) devolvem **um único objeto**, já filtrado pelo
`codigo_empresa` selecionado no seletor de empresa do header — o total da unidade
escolhida, não a fatia de cada unidade dentro do total geral do período.

Proposta: quando o endpoint for chamado **sem** `codigo_empresa`, devolver a quebra
por unidade em vez de um único total consolidado — reaproveitando o mesmo formato de
linha que já existe hoje pra uma unidade só, só que em lista:

```
GET /vendas-mensal?competencia=2026-09
→ [
    { "codigo_empresa": "<uuid>", "vendas_total": "1860000.00", "meta": "...", ... },
    { "codigo_empresa": "<uuid>", "vendas_total": "1190000.00", "meta": "...", ... },
    ...
  ]

GET /faturamento-mensal?competencia=2026-09
→ (mesmo formato, um item por codigo_empresa)
```

Mesma proposta para o endpoint de faturamento. O `join` com nome + `cor_unidade` de
cada unidade eu faço no próprio Next.js, que já busca a lista de unidades pra outros
fins (seletor de empresa no `OverlayHeader`).

**Importante:** isso não muda o comportamento atual — o gauge continua chamando com
`codigo_empresa` normalmente e recebendo um objeto só; o array por unidade só entra
quando esse parâmetro não é enviado, então é aditivo, não é breaking change.

---

## 4. O que muda no frontend (Next.js) — sem ação do DBA

- Tela de Unidades (`cadastros/auxiliares/unidades/page.tsx`): novo campo "Cor"
  (`TextField type="color"`) — mesmo padrão já usado em Setores
  (`app/(protected)/cadastros/auxiliares/setores/page.tsx`, linhas 459–465).
- `RevenueGauge`/`Gauge` (`components/Dashboards/RevenueGauge`,
  `components/Charts/Gauge`): novo anel de participação por unidade, usando o array do
  item 3 e a cor de cada unidade (`cor_unidade`, com fallback pra unidade sem cor
  cadastrada).

---

## 5. Rollout sugerido

1. DBA aplica a migration da coluna `cor_unidade` (item 1.1) — coluna nula não muda
   nada em produção.
2. Backend inclui `cor_unidade` no CRUD de `unidades` (item 2) e implementa a quebra
   por unidade em `vendas-mensal`/`faturamento-mensal` quando `codigo_empresa` não é
   enviado (item 3) — como o comportamento com `codigo_empresa` não muda, nada quebra
   pra quem já consome esses endpoints.
3. Eu adiciono o campo "Cor" na tela de Unidades e o anel novo nos dois dashboards.
4. Alguém cadastra uma cor pra cada unidade — até lá, o anel usa um fallback neutro
   pra quem ainda não tem `cor_unidade` definida.
