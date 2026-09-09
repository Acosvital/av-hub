# Pedido de melhoria — expor `previsao_faturamento`/`faturado` no Detalhe do Vendedor

**Criado em:** 09/09/2026, a partir do modal "Detalhe do Vendedor" (abre ao clicar num
vendedor no ranking dos dashboards).

**Não é bug — é uma melhoria de API.** O Nathan pediu pra replicar em "Detalhe do
Vendedor" o mesmo selo de prazo (SLA) que "Meus Pedidos" já tem — atrasado / vence hoje /
faltam N dias / normal, com o card piscando quando vence hoje. **Investiguei antes de
implementar** (a pedido dele) e a resposta é: **não dá pra fazer só no frontend hoje** —
falta um campo na API.

---

## 1. Por que não é só frontend

A regra de SLA (`utils/slaPedido.ts`) já existe e é 100% reaproveitável — só precisa de
duas informações por pedido: `previsao_faturamento` (data prevista) e `faturado`
(boolean). O problema é que o endpoint que alimenta o modal não devolve isso.

- Modal: `components/Dashboards/VendorDetailsModal/VendorDetailsModal.tsx`, chama
  `getDetalheVendedorVendas`/`getDetalheVendedorFaturamento`
  (`services/dashboards/dashboardVendas.ts:219-241`,
  `services/dashboards/dashboardFaturamento.ts:282-304`) → `/api/dashboard/vendas/detalhe-vendedor`
  e `/api/dashboard/faturamento/detalhe-vendedor` → backend
  `fn_detalhe_vendedor_vendas`/`fn_detalhe_vendedor_faturamento`.
- Os campos que o backend devolve por pedido/nota são fixos
  (`src/routes/fn_detalhe_vendedor_vendas.js:28-31`):
  ```js
  const DETALHE_FIELDS = [
    "mes", "ano", "codigo_empresa", "cod_vendedor", "numero_pedido", "numero_nf", "nome_cliente",
    "data_pedido", "valor_pedido", "tipo_contrato", "situacao", "is_track_record",
  ];
  ```
  e (`src/routes/fn_detalhe_vendedor_faturamento.js:40-44`):
  ```js
  const DETALHE_FIELDS = [
    "mes", "ano", "codigo_empresa", "cod_vendedor", "numero_pedido", "numero_nf",
    "nome_cliente", "data_emissao", "valor_nf", "tipo_contrato", "classificacao",
    "situacao", "is_track_record",
  ];
  ```
  Nenhuma das duas listas tem `previsao_faturamento`/`data_previsao` nem um `faturado`
  booleano. E como essas duas rotas usam **funções** Postgres (`fn_detalhe_vendedor_vendas`/
  `_faturamento`), não uma view — não é só alargar essa lista no Node: a função em si
  precisa devolver essas colunas, senão elas não existem em `r` pra nenhum `pick()` pegar.
- `DetalheVendedorVendasPedidoProps`/`DetalheVendedorFaturamentoPedidoProps`
  (`app/(protected)/dashboards/dash-vendas/types.ts:98-111`,
  `dash-faturamento/types.ts:108-121`) confirmam isso do lado do frontend — os tipos batem
  exatamente com essas listas, sem nenhum campo de previsão.

## 2. O que já existe pronto (mesmo padrão, comprovado)

Isso não é um recurso novo — já existe e funciona em "Meus Pedidos" (Portal do Vendedor):

- `utils/slaPedido.ts` — `calcularSlaPedido(previsaoFaturamento, faturado)` → tier
  (`atrasado`/`vence-hoje`/`falta-1-dia`/`falta-2-dias`/`falta-3-dias`/`normal`), 100%
  pronto, sem nenhuma mudança necessária.
- `app/(protected)/meus-pedidos/styles.module.css:200-215` — `.cardVenceHoje` com
  `animation: cardPulseVenceHoje` (o "piscando" mencionado).
- Fonte de dado real desse caso: `core_vendas_faturamento.vw_vendas_base`
  (`GET /vendas_base`), que já expõe exatamente `previsao_faturamento` e `faturado` por
  pedido — só que é uma rota diferente (agregada por vendedor+período, não por card de
  detalhe do ranking).

## 3. Pedido concreto

1. Adicionar `previsao_faturamento` e `faturado` em `DETALHE_FIELDS` de
   `fn_detalhe_vendedor_vendas` — e na própria função Postgres, buscando (provavelmente)
   da mesma fonte que `vw_vendas_base` já usa (`pedidos_vendas.data_previsao`, boolean de
   faturado do pedido).
2. Mesma coisa em `fn_detalhe_vendedor_faturamento`, **se fizer sentido pro caso de uso**:
   como essa lista é de NOTAS FISCAIS (`numero_nf`, `data_emissao`, `valor_nf`), o pedido
   por trás normalmente já foi faturado — o selo de "atrasado" tende a não se aplicar tão
   naturalmente quanto no lado de Vendas. Sugiro priorizar o item 1 (Vendas) e avaliar o
   2 com calma — o Nathan pode confirmar se quer nas duas telas ou só na de Vendas.

## 4. Fora de escopo

- **Comissões** (`dash-comissoes`) não usa `VendorDetailsModal` — não abre esse modal ao
  clicar num vendedor hoje, então não há nada a mudar lá por enquanto.

## 5. O que o frontend fará assim que o campo existir

Puramente reaproveitar o que já existe: mapear `previsao_faturamento`/`faturado` de cada
item de `detalhes` pro mesmo `calcularSlaPedido` que "Meus Pedidos" usa, e aplicar as
mesmas classes de cor/badge/piscar em `components/Dashboards/VendorDetailsModal/Order.tsx`
(ou onde cada linha é renderizada) — nenhuma lógica nova de SLA precisa ser escrita.
