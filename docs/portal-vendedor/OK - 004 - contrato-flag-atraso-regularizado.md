# Contrato — sinalizar pedido que já esteve atrasado e depois foi faturado

**❌ Bloqueado — falta dado no backend.** Testei ao vivo (07/09) o endpoint que já existe pra
histórico por pedido (`GET /pedidos_vendas/:id/status-historico`, consumido em "Meus Pedidos" no
botão "Ver histórico") em 3 pedidos faturados de agosto/2026 (`10448564234`, `10444101170`,
`11219517033`) — os três vieram com `"historico":[]`. Mesmo quando populado, esse endpoint só
registra transições de `situacao` (texto livre, ex.: "Faturado parcialmente" → "Faturado"), nunca
mudanças de `data_previsao`. Não há como viabilizar o pedido abaixo sem uma dessas duas mudanças
no backend.

**Objetivo:** em "Meus Pedidos" (`app/(protected)/meus-pedidos/page.tsx`), quando um pedido já foi
faturado mas em algum momento esteve com `data_previsao` vencida (e a data foi empurrada pra
frente antes de ser finalmente faturado), mostrar um selo tipo "Faturado com atraso" no lugar do
selo "Faturado" simples — hoje a tela não tem como diferenciar esse caso de um pedido que sempre
foi pago no prazo.

---

## 1. Por que não dá pra fazer só no frontend

O frontend só recebe o valor **atual** de `data_previsao` (`GET /vendas_base`, ver
`001 - contrato-data-previsao-vendas-base.md`) — não o histórico de valores que esse campo já
teve. Se um pedido venceu em 20/08, alguém empurrou a previsão pra 05/09 e só depois ele foi
faturado, a resposta de hoje só traz `data_previsao: "2026-09-05"` e `faturado: true` — não sobra
nenhum rastro de que a data original (20/08) já tinha passado. Sem um desses dois campos abaixo, é
impossível reconstruir isso no cliente.

## 2. Duas opções de solução (backend escolhe)

**Opção A — expor o histórico de `data_previsao`** (granular, reaproveita o padrão já existente de
`historico.hst_pedidos_vendas`): acrescentar `data_previsao` como mais um campo rastreado nesse
esquema de histórico, do mesmo jeito que `situacao_anterior`/`situacao_nova` já são hoje — o
frontend computa a partir daí se, em algum ponto anterior ao faturamento, a data vigente já tinha
passado.

**Opção B — expor uma flag computada pronta** (mais simples pro backend entregar, menos flexível):
`GET /vendas_base` passa a devolver algo como `foi_atrasado_antes_de_faturar: boolean` — o backend
já sabe comparar a data de faturamento contra o histórico de `data_previsao` na tabela de origem
(que aparentemente existe — `core_vendas_faturamento.pedidos_vendas`/`historico.hst_pedidos_vendas`
— já que é de lá que vem o valor atual), e devolve pronto.

Não tenho acesso ao código do backend pra implementar nenhuma das duas — só documentando o
contrato pra quando alguém com acesso puder avaliar.

## 3. O que muda no frontend (Next.js), depois de uma das duas opções existir

- Opção A: `services/vendas/pedidosVenda.ts` (ou equivalente) já traria o histórico de datas junto
  da lista, ou um novo campo no histórico por pedido; `calcularSlaPedido`/`badgeStatus` em
  `app/(protected)/meus-pedidos/page.tsx` ganham a lógica de comparação.
- Opção B: só consumir o novo booleano — se `faturado && foi_atrasado_antes_de_faturar`, o selo de
  status vira algo como "⛔ Faturado com atraso" em vez de "Faturado" simples (cor intermediária,
  ex. `var(--red-light)` sobre fundo verde-escuro, pra diferenciar do "Faturado" no prazo).

## 4. Rollout sugerido

1. Time de backend decide entre opção A (histórico) ou B (flag pronta) — B é bem mais rápido de
   implementar se a comparação de datas já for trivial na query que já existe pra popular
   `data_previsao`.
2. Adicionar o campo no schema Swagger e na view/rota correspondente.
3. Confirmar em produção com um pedido conhecido que já teve esse ciclo (venceu → data empurrada →
   faturado) antes do frontend depender do campo.
