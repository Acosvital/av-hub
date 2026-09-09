# Contrato — juntar `core.etapas_faturamento` em `vw_vendas_base` (e `vw_nf_classified`)

**✅ Implementado e confirmado ao vivo (08/09).** `GET /vendas_base` já devolve `etapa_descricao`
(ex.: `"Liberado Compras"`, `"Faturado"`, `"Separar Estoque"`) — join feito, frontend consumindo.
Testado logado como vendedor real: "Meus Pedidos" mostra o fact "Etapa" em cada card, "Meu
Dashboard" mostra a etapa em "Próximos vencimentos". Sem pendência.

**Objetivo:** em "Meus Pedidos", "Minhas Notas" e "Meu Dashboard" (próximos vencimentos), mostrar o
nome da etapa do pedido (ex.: "Faturado", "Separar Estoque") em vez do código numérico — pendência
já registrada em `docs/portal-vendedor/plano-portal-vendedor.md` ("Dicionário de `etapa`" — em
andamento).

---

## 1. Situação atual — confirmado no código deste repo (frontend)

`core_vendas_faturamento.pedidos_vendas.etapa` já chega no frontend hoje via `GET /vendas_base`
(`app/api/meus-pedidos/route.ts`) e está tipado em `PedidoVendedorProps.etapa: string | null`
(`app/(protected)/meus-pedidos/types.ts:22`) — mas **não é usado em lugar nenhum da UI**, porque é
só o código numérico, sem dicionário. `GET /nf_classified` (`app/api/minhas-notas/route.ts`), por
sua vez, nem carrega `etapa` — `NotaFiscalVendedorProps` não tem esse campo hoje.

Este repo é um BFF puro (todo `app/api/**` só faz proxy pra `${API_URL}/<recurso>` com
`x-api-key`) — não há acesso a banco aqui, então o `JOIN` abaixo só pode ser feito no serviço de
backend (Sequelize), não neste repo.

## 2. Mudança pedida — LEFT JOIN novo na projeção

Junção confirmada com o usuário (ver `005_etapas_faturamento_contrato.md`, seção "Como isso se
junta com pedidos_vendas/notas_fiscais"):

```sql
-- vw_vendas_base — join no codigo_etapa do próprio pedido, operação sempre '11' (venda cliente):
LEFT JOIN core.etapas_faturamento ef
  ON ef.codigo_empresa  = p.codigo_empresa
 AND ef.codigo_operacao = '11'
 AND ef.codigo_etapa    = p.etapa::smallint
 AND ef.deleted_at IS NULL

-- projeção final, mesmo padrão de COALESCE já documentado no contrato da tabela:
COALESCE(ef.descricao, ef.descricao_padrao) AS etapa_descricao
```

Mesmo padrão de `data_previsao` (`001 - contrato-data-previsao-vendas-base.md`): repassar
`etapa_descricao` por todas as CTEs intermediárias da view até a `SELECT` final, nas duas pernas do
`UNION ALL` (viva `pedidos_vendas` / histórica `historico.hst_pedidos_vendas`) — ambas já carregam
`etapa` e `codigo_empresa`, então o join é idêntico nas duas.

**`vw_nf_classified` (opcional, só se quiserem etapa também em "Minhas Notas"):** a nota não tem
`etapa` própria — precisa do join indireto via `notas_fiscais.oppedido`/`numero_pedido` até o
pedido de origem pra pegar `pedidos_vendas.etapa`, e só então até `etapas_faturamento` (mesma regra
`codigo_operacao = '11'`, já que a etapa em questão é a do pedido, não o tipo da NF — ver seção do
contrato da tabela sobre a diferença entre as duas junções). Se for trabalhoso, dá pra deixar essa
parte pra uma fase 2 — "Meus Pedidos" e "Meu Dashboard" já cobrem o essencial sozinhos.

## 3. API — schema de resposta

`GET /vendas_base` ganha `etapa_descricao: string | null` no objeto de resposta (nome já
resolvido, `varchar(100)`; `null` só no caso raro de o catálogo daquela filial ainda não ter
sincronizado a etapa em questão — pipeline roda full sync diário, então é transitório). Continua
devolvendo `etapa` (código cru) também, sem remover — quem já usa o campo hoje não quebra.

Se a fase 2 (notas) for feita, `GET /nf_classified` ganha o mesmo campo `etapa_descricao`.

## 4. O que muda no frontend (Next.js) — sem ação do DBA

- `app/(protected)/meus-pedidos/types.ts`: `PedidoVendedorProps` ganha `etapa_descricao: string | null`.
- `app/(protected)/meus-pedidos/page.tsx`: novo fact "Etapa: `{etapa_descricao}`" no bloco
  `.orderFacts`, ao lado de "Incluído"/"Previsão de faturamento"/"Categoria" — só renderiza se
  `etapa_descricao` não for `null`.
- `lib/api/meuDashboardDomain.ts`: `PedidoVencimentoBrutoProps`/`ProximoVencimentoProps` ganham
  `etapa_descricao`, repassado no `.map()` de `proximosVencimentos()`; "Meu Dashboard"
  (`app/(protected)/meu-dashboard/page.tsx`, seção "Próximos vencimentos") passa a exibir junto da
  linha de cada pedido.
- `services/portalVendedor/pedidosDoCliente.ts` / `PedidoClienteProps` (modal de detalhes do
  cliente no dashboard): mesmo campo, se fizer sentido mostrar etapa também ali.
- Fase 2 (se aplicável): `app/(protected)/minhas-notas/types.ts` (`NotaFiscalVendedorProps`) e
  `.nfFacts` em `minhas-notas/page.tsx`.

## 5. Rollout sugerido

1. Confirmar em produção que `core.etapas_faturamento` já está populada pra todas as filiais
   ativas (full sync diário do recurso `etapasFaturamento` já ligado no pipeline — ver seção final
   do contrato da tabela).
2. Alterar `vw_vendas_base` com o `LEFT JOIN` acima (aditivo, não quebra consumidores atuais).
3. Adicionar `etapa_descricao` no schema Swagger e no `map`/`select` de
   `src/routes/vw_vendas_base.js` / `src/services/vw_vendas_base.js`.
4. Confirmar em produção com um pedido conhecido (etapa ativa e com `descricao` customizada, tipo
   os exemplos do contrato original — "Liberado Compras") antes do frontend depender do campo.
5. Se decidirem pela fase 2, repetir os passos 2-4 pra `vw_nf_classified`.
