# Contrato — filtro por vendedor em `GET /ranking_clientes_vendas` e `/ranking_clientes_faturamento`

**✅ Implementado (04/09) — confirmado ao vivo.** Testei com vendedor real (`cod_vendedor=9788746570`)
vs. inventado: com o real, veio `total: 3` clientes e `perc_participacao` recalculado (76,30%);
com o inventado, `total: 0`. Libera o item 8.5 do plano ("Top clientes do vendedor") — ainda não
implementado no frontend, fica pra quando entrar na fila de extras.

**Objetivo:** hoje os dois endpoints de ranking de clientes só rankeiam clientes da
**empresa/unidade inteira** — não existe como pedir "só os clientes deste vendedor". Isso
bloqueia qualquer tela de autoatendimento do vendedor que precise mostrar "meus maiores
clientes" (ver `docs/portal-vendedor/plano-portal-vendedor.md`, item 8.5).

**Confirmado ao vivo (03/09), não é falta de doc — o parâmetro não existe:** chamei o endpoint
duas vezes, uma sem filtro de vendedor e outra mandando um `cod_vendedor` propositalmente
inventado, e a resposta veio **idêntica** nos dois casos — mesmo `total`, mesmo primeiro
cliente. O backend simplesmente ignora esse parâmetro hoje, porque a rota não foi feita pra
recebê-lo.

```
GET /ranking_clientes_vendas?mes=9&ano=2026&limit=3
→ total: 41, primeiro cliente: "PERENCO PETROLEO E GAS DO BRASIL LTDA"

GET /ranking_clientes_vendas?mes=9&ano=2026&limit=3&cod_vendedor=9999999999   (código inventado)
→ total: 41, primeiro cliente: "PERENCO PETROLEO E GAS DO BRASIL LTDA"   (idêntico)
```

---

## 1. API — novo parâmetro opcional `cod_vendedor`

Mesmo nome de parâmetro já usado em `GET /ranking_vendedores_vendas` e
`GET /detalhe_vendedor_vendas` (não `codigo_vendedor_omie`, que é o nome da coluna crua em
`vendedores`/`pedidos_vendas` — `cod_vendedor` é a convenção já estabelecida nos endpoints de
ranking/detalhe).

```
GET /ranking_clientes_vendas?mes=9&ano=2026&codigo_empresa=<uuid>&cod_vendedor=<codigo>
GET /ranking_clientes_faturamento?mes=9&ano=2026&codigo_empresa=<uuid>&cod_vendedor=<codigo>
```

**Comportamento:**
- `cod_vendedor` ausente → comportamento atual, sem mudança (ranking da empresa/unidade
  inteira). Retrocompatível — ninguém que já usa o endpoint hoje é afetado.
- `cod_vendedor` presente → rankeia só os clientes que compraram **daquele vendedor** no
  período, com os valores (`vendas`/`faturamento`, `qtd_pedidos`/`total_nfs`,
  `perc_participacao`) recalculados sobre o total desse vendedor, não da empresa. Mesma lógica
  de escopo que `detalhe_vendedor_vendas` já aplica linha a linha — aqui é a mesma coisa,
  agrupada por cliente em vez de por pedido.

**Shape da resposta não muda** — mesmo formato de hoje (`ClientRankingVendasProps`/
`ClientRankingFaturamentoProps`), só o filtro aplicado por trás muda.

### 1.1 Contrato de erro

Se quem chamar mandar um `cod_vendedor` que não existe (digitado errado, por exemplo), acho
que faz mais sentido devolver lista vazia (`total: 0`) do que erro — mesmo padrão que os outros
endpoints de ranking já têm hoje pra combinações sem resultado, mas fica a critério de quem
implementar se preferir `404`.

---

## 2. SQL — sketch da mudança (ilustrativo, não é o código real da função)

Não tenho acesso ao código-fonte da função que gera `ranking_clientes_vendas`/
`_faturamento` — isto é um esboço de como a mudança provavelmente se parece, seguindo o mesmo
padrão de filtro condicional já usado em outras funções deste banco (ex.: `escopoSetor.js`,
que só filtra quando o parâmetro vem preenchido). Adaptar pro SQL real da função:

```sql
-- Pseudocódigo do WHERE da função/view que já gera o ranking hoje —
-- adiciona um filtro condicional por cod_vendedor, igual ao filtro de
-- codigo_empresa que a função já aplica quando informado.
WHERE b.mes = :mes
  AND b.ano = :ano
  AND (:codigo_empresa IS NULL OR b.codigo_empresa = :codigo_empresa)
  AND (:cod_vendedor IS NULL OR b.cod_vendedor = :cod_vendedor)   -- linha nova
GROUP BY b.codigo_cliente, ...
```

Se a função já agrupa vendas do mesmo cliente entre unidades diferentes (o campo `empresas[]`
na resposta sugere que sim — um cliente pode aparecer com pedidos em mais de uma unidade), o
filtro por `cod_vendedor` deveria entrar **antes** desse agrupamento, não depois — senão um
cliente que compra de dois vendedores em unidades diferentes apareceria com o valor errado
(subtraindo só depois de já ter somado tudo).

---

## 3. O que muda no frontend (Next.js) — sem ação do DBA

- `app/api/dashboard/vendas/ranking-clientes/route.ts` e o equivalente de faturamento passam a
  repassar `cod_vendedor` na lista de parâmetros encaminhados (mesmo padrão dos outros ~10
  parâmetros já repassados ali, uma linha).
- `services/dashboards/dashboardVendas.ts`/`dashboardFaturamento.ts` —
  `GetRankingClientesVendasParams`/`GetRankingClientesFaturamentoParams` ganham
  `cod_vendedor?: string`, incluído na query string da mesma forma que os outros campos.
- Nenhuma mudança de tipo (`ClientRankingVendasProps`/`ClientRankingFaturamentoProps` continuam
  iguais) — só um parâmetro de request a mais.
- Habilita o item 8.5 do `plano-portal-vendedor.md` ("Top clientes do vendedor") a usar o
  endpoint de ranking direto, em vez de agregar `detalhe_vendedor_vendas` no frontend — mais
  simples e mais correto (o agrupamento acontece no banco, não no navegador).

---

## 4. Rollout sugerido

1. Backend adiciona o parâmetro condicional nas duas funções (vendas e faturamento) — como é
   opt-in (`cod_vendedor` ausente = comportamento atual), não quebra nenhum consumidor
   existente do ranking geral.
2. Confirmar com o backend se o agrupamento por cliente entre unidades (`empresas[]`) já
   considera vendedor corretamente antes de somar, ou se precisa de ajuste (seção 2).
3. Frontend troca a implementação client-side do item 8.5 pelo parâmetro novo assim que
   confirmado em produção — mudança pequena, já isolada num único ponto (o service de
   ranking de clientes).
