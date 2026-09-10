# Contrato — incluir `data_previsao` em `vw_vendas_base` / `GET /vendas_base`

**✅ Implementado (04/09) — confirmado ao vivo.** `GET /vendas_base` já devolve `data_previsao`
por pedido (ex.: `"data_previsao":"2026-09-19"`). "Meus Pedidos" já consome o campo — o selo de
SLA (seção 5 do plano) está funcionando, sem pendência.

**Objetivo:** o Portal do Vendedor (`docs/portal-vendedor/plano-portal-vendedor.md`, seção 5) precisa de
`data_previsao` por pedido pra calcular o selo de SLA em "Meus Pedidos". A lista principal dessa
tela usa `GET /vendas_base` como fonte (nome do cliente, categoria, status/refaturamento já
resolvidos) — só falta esse campo, que já existe na tabela de origem mas não é repassado pela
view.

---

## 1. Situação atual — confirmado na SQL real da view

`core_vendas_faturamento.pedidos_vendas` já tem a coluna (`data_previsao character varying(10)`).
A view `core_vendas_faturamento.vw_vendas_base` lê dessa mesma tabela (CTE `pv_src`), mas a
projeção não inclui `data_previsao` — fica de fora desde a primeira CTE, então não há como
recuperar o campo em nenhuma etapa seguinte da view sem alterar essa projeção.

Existe uma segunda view, `vw_vendas_planilha`, que já traz `data_previsao` — mas ela não tem
nenhuma rota de API associada (nenhum arquivo em `src/routes/` a referencia), então não serve
como alternativa sem também expor uma rota nova.

---

## 2. Mudança pedida — 1 coluna a mais na projeção

A view já faz `UNION ALL` entre a tabela viva (`pedidos_vendas`) e a histórica
(`historico.hst_pedidos_vendas`) na CTE `pv_src`; a mudança é simétrica nas duas pernas:

```sql
-- CTE pv_src, perna viva — acrescentar a coluna que já existe na tabela:
SELECT false AS is_track_record,
    p.codigo_pedido_omie,
    p.numero_pedido,
    p.codigo_empresa,
    p.sequencial,
    p.etapa,
    p.data_inclusao,
    p.hora_inclusao,
    p.data_previsao,          -- NOVO
    p.codigo_cliente,
    ...
  FROM core_vendas_faturamento.pedidos_vendas p

-- CTE pv_src, perna histórica — mesma coluna, mesma posição:
SELECT true AS is_track_record,
    ...
    h.data_previsao,          -- NOVO
    ...
  FROM historico.hst_pedidos_vendas h
```

A coluna precisa ser repassada por todas as CTEs intermediárias que hoje recortam a lista de
campos (`pv_base`, `com_manifesto`, `enriquecida`, `consolidado`, `base`) até a `SELECT` final —
mesmo padrão que qualquer outro campo do pedido (ex.: `numero_contrato`) já segue hoje.

**Sobre a linha devolvida (família x parcial):** a view já filtra `WHERE sequencial = 0` — só
devolve o pedido "guarda-chuva" de cada família. `data_previsao` do guarda-chuva é a que interessa
pro SLA da linha agrupada (mesmo raciocínio já usado pro valor: se o guarda-chuva ainda não foi
dividido em parciais, essa é a única data que existe; se já foi dividido, é a data do pedido
original, que segue sendo relevante enquanto ele não estiver 100% faturado).

---

## 3. API — schema de resposta

`GET /vendas_base` ganha `data_previsao` no objeto de resposta (mesmo formato `varchar(10)`
"AAAA-MM-DD" que a rota crua `GET /pedidos_vendas` já devolve pro mesmo campo — não inventar
formato novo).

---

## 4. O que muda no frontend (Next.js) — sem ação do DBA

- `services/vendas/vendasBase.ts` (ou onde for criado o service dessa rota) ganha `data_previsao`
  no tipo de resposta.
- "Meus Pedidos" (`docs/portal-vendedor/plano-portal-vendedor.md`, seções 4.2/5) passa a calcular o SLA
  diretamente da mesma chamada que já busca a lista — sem precisar de uma segunda chamada em
  `GET /pedidos_vendas` só pra esse campo, como seria o plano B na ausência dessa mudança.

---

## 5. Rollout sugerido

1. Alterar a view (`CREATE OR REPLACE VIEW`, sem quebrar nenhum consumidor existente — é aditivo,
   só acrescenta uma coluna).
2. Adicionar o campo no schema Swagger e no `map`/`select` da rota `GET /vendas_base`
   (`src/routes/vw_vendas_base.js` / `src/services/vw_vendas_base.js`).
3. Confirmar em produção que a coluna aparece na resposta antes do frontend depender dela.

Mudança pequena e aditiva — não deveria quebrar nenhum consumidor atual de `vendas_base` (dashboards
de admin, etc.), só adiciona um campo a mais na resposta.
