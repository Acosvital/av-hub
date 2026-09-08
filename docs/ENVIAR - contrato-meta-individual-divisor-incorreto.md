# Bug de backend — `meta_individual` divide a meta GLOBAL pelo headcount de cada unidade isoladamente

**Criado em:** 06/09/2026, 12:18 (horário de Brasília) — **atualizado** 06/09/2026, 12:30 após
o Nathan confirmar: a meta é global (da empresa toda), não por unidade. Isso muda o
diagnóstico — ver correção abaixo.

**Reportado por:** Nathan, a partir do Portal do Vendedor (`/meu-dashboard`) logado como a
vendedora Ana Carolina Vital, mês de referência agosto/2026 — "Meta individual" aparecia como
R$ 4.948.412,70, valor considerado alto demais / incorreto.

**Status:** **não é bug no frontend.** Testado ao vivo contra a API de produção
(`https://api.acosvital.com.br/`) em 06/09/2026 — `lib/api/meuDashboardDomain.ts` (`somarLado`)
soma corretamente `meta_individual` de cada vínculo de vendedor, mas o **valor que a API
devolve por vínculo já vem incorreto** — e a causa raiz é mais séria do que uma primeira
análise sugeria (ver nota de correção no fim).

---

## 1. O que a investigação encontrou

A empresa tem só **2 unidades** e uma **meta global única** para agosto/2026:

```
GET /dashboard_mensal_vendas?mes=8&ano=2026
→ consolidado.meta = "29000000.00"   (uma meta só, da empresa inteira)
→ data: [
    { codigo_empresa: "759979bd-...", vendas_total: "29112896.07" },  // unidade grande
    { codigo_empresa: "4ec9f957-...", vendas_total: "789499.77"  },  // unidade satélite
  ]
```

Ana Carolina Vital tem vínculo de vendedor nas 2 unidades:

| Unidade | Vendedores **com venda** no mês (`ranking_vendedores_vendas`, total) | Vendedores **cadastrados** (`/vendedores?codigo_empresa=X`) | `meta_individual` devolvida |
|---|---|---|---|
| Satélite (`4ec9f957-...`) | 7 | 17 | R$ 4.142.857,14 |
| Grande (`759979bd-...`) | 36 | 88 | R$ 805.555,56 |
| **Soma (o que o frontend mostra hoje)** | | | **R$ 4.948.412,70** |

**A causa exata, confirmada por aritmética:**

```
29.000.000,00 / 7  = 4.142.857,14   ✓ bate exato com a unidade satélite
29.000.000,00 / 36 = 805.555,56     ✓ bate exato com a unidade grande
```

Ou seja: a API pega a **mesma meta global** (R$ 29.000.000,00) e divide, **de forma
independente em cada unidade**, pela quantidade de vendedores que tiveram venda **só naquela
unidade** no mês — em vez de dividir uma única vez pelo total de vendedores da empresa
inteira. Isso é pior do que "cada unidade tem sua meta própria" (primeira hipótese, já
descartada pelo Nathan): a mesma meta de R$ 29 milhões está sendo "gasta" duas vezes, uma vez
inteira para cada unidade.

## 2. Qual deveria ser o valor certo

Com a meta global e o headcount certo, o valor de `meta_individual` (igual pra todo mundo,
independente de unidade) deveria ser um dos dois abaixo — **depende da definição de negócio**
que falta confirmar com o time de backend:

| Divisor usado | Cálculo | `meta_individual` correta |
|---|---|---|
| Todos os vendedores que tiveram venda em agosto, **somando as 2 unidades** (7+36=43, sem contar a Ana 2x) | 29.000.000 / 43 | **R$ 674.418,60** |
| Todos os vendedores **cadastrados**, **somando as 2 unidades** (17+88=105) | 29.000.000 / 105 | **R$ 276.190,48** |

Qualquer uma das duas é *muito* menor que os R$ 4.948.412,70 mostrados hoje — a diferença é
de 7× a 18×.

## 3. O que precisa mudar (backend)

Na função/view que gera `ranking_vendedores_vendas` / `ranking_vendedores_faturamento`
(mesma família de `contrato-vinculo-vendedor-funcionario.md`), o cálculo de `meta_individual`
precisa:

1. Buscar a meta **global** uma vez (não por `codigo_empresa`) — já existe em
   `dashboard_mensal_vendas.consolidado.meta`, então provavelmente é só reaproveitar essa
   mesma fonte.
2. Dividir por um headcount **também global** (soma de vendedores de todas as unidades, não só
   da unidade do `codigo_empresa` filtrado na query) — precisa confirmar com backend se
   "headcount" = vendedores com venda no mês ou vendedores cadastrados (tabela acima mostra as
   duas opções).
3. Resultado: `meta_individual` deveria vir **idêntica para todo vendedor da empresa**,
   independente de unidade — hoje ela varia por unidade (4,14M vs 805k), o que já é, por si só,
   um sinal de que o cálculo está isolado por unidade quando não deveria.

## 4. Implicação no frontend — importante para quando o backend corrigir

`somarLado` (`lib/api/meuDashboardDomain.ts`) hoje **soma** `meta_individual` de cada vínculo
de um vendedor com múltiplas unidades (seção 8.5 do plano do Portal do Vendedor). Isso faz
sentido pra `vendas`/`valor` (as vendas de cada unidade são reais e adicionais, faz sentido
somar). **Não faz sentido para `meta_individual`** se a meta é global e igual pra todo mundo:
depois que o backend corrigir e passar a devolver o **mesmo** valor de `meta_individual` em
todos os vínculos de uma pessoa, somar esses valores (como o frontend faz hoje) vai **duplicar
indevidamente** a meta de quem tem vínculo em mais de uma unidade (ex.: Ana Carolina teria sua
meta contada 2×, um vendedor de unidade única não).

**Ação de frontend pendente, condicionada à correção do backend:** trocar, em `somarLado`, a
soma de `meta_individual` por algo que pegue o valor **uma vez só** por vendedor (ex.: do
primeiro vínculo, já que depois da correção o valor será igual em todos) em vez de
`somaMetaIndividual += Number(linha.meta_individual)`. Não fazer essa mudança agora —
depende primeiro da correção do backend, e testar com um valor ainda inconsistente por unidade
não ajudaria a validar nada.
