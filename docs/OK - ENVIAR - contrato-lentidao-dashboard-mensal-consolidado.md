# Contrato — Lentidão de `dashboard_mensal_vendas`/`dashboard_mensal_faturamento` sem `codigo_empresa`

**Criado em:** 10/09/2026, 11:31 (horário de Brasília)

**Objetivo:** os dashboards do Hub agora se atualizam sozinhos (auto-refresh a cada 1min, sem
precisar de F5 — ver `hooks/useAutoRefresh.ts`). Isso expôs um problema de performance que já
existia, mas passava despercebido: a variante **agregada** (sem `codigo_empresa`, somando todas
as empresas) de `dashboard_mensal_vendas`/`dashboard_mensal_faturamento` é extremamente lenta
quando "fria", a ponto de estourar timeout e o frontend mostrar o dashboard zerado.

---

## 1. Evidência — confirmado ao vivo hoje

Testei `dashboard_mensal_vendas?mes=9&ano=2026` direto na API (`https://api.acosvital.com.br`),
sem `codigo_empresa`:

| Chamada | Tempo |
|---|---|
| 1ª (fria) | **113,5s** |
| 2ª (logo em seguida) | 4,3s |
| 3ª (logo em seguida) | 3,5s |

A mesma consulta **com** `codigo_empresa` (1 empresa só) respondeu em 13,9s de primeira — mais
rápida que a agregada fria, mas ainda alta pro que deveria ser uma consulta filtrada por PK.

Não confirmei o mesmo tempo de "fria" em `dashboard_mensal_faturamento` (testei só depois que o
cache/aquecimento provavelmente já estava quente por causa dos testes de `vendas` — respondeu em
< 1s). Mas é a mesma função (`resumoEmpresa` em `lib/api/dashboardEquipeDomain.ts`) chamando o
mesmo tipo de consulta, só que na tabela de faturamento — muito provável que sofra do mesmo
problema "fria", mesmo sem eu ter cronometrado esse caso específico.

## 2. Por que isso virou "dashboard zerado" (não um erro visível)

`resumoEmpresa`/`somarLado` (usadas por Dashboard da Equipe e Meu Dashboard) tratam timeout/erro
dessa chamada devolvendo um objeto zerado em vez de lançar — de propósito, pra 1 seção lenta não
derrubar o dashboard inteiro (padrão usado em várias funções desses dois arquivos de domínio).
Isso é razoável pra uma falha pontual de verdade, mas significa que uma consulta lenta e um erro
de fato ficam indistinguíveis pra quem consome — os dois aparecem como "zero".

Como consequência, todo refresh (manual ou automático) que bater nessa consulta fria tem chance
de mostrar o dashboard zerado, mesmo com dado real existindo. Já mitiguei uma parte disso no
frontend (Dashboard da Equipe e Meu Dashboard agora descartam um refresh silencioso que volta com
vendas E faturamento zerados ao mesmo tempo, mantendo o último dado bom) — mas isso só esconde o
sintoma. A causa é a lentidão da consulta em si.

## 3. O que peço pra investigar

Provável causa: a variante agregada (sem `codigo_empresa`) não tem o mesmo suporte de índice/
cache/materialização que a variante filtrada por empresa — parece estar recalculando do zero a
cada vez que o cache (o que quer que esteja deixando as chamadas seguintes rápidas) expira, em vez
de manter um resultado pré-computado sempre pronto pra esse caso "todas as empresas".

Algumas direções possíveis (não sei qual se aplica sem ver a query/schema):
- Índice faltando na coluna/expressão usada pra agrupar por empresa quando `codigo_empresa` não é
  passado.
- Materialized view ou tabela de resumo pré-agregada (tipo as `vw_*` que já existem pra outras
  consultas) que hoje só cobre o caso filtrado, não o "consolidado".
- Cache (Redis ou em memória) com TTL curto demais pra esse caso específico, fazendo recalcular
  do zero com frequência.

## 4. Rollout sugerido

1. Time de backend/DBA investiga por que a variante sem `codigo_empresa` de
   `dashboard_mensal_vendas`/`dashboard_mensal_faturamento` é tão mais lenta "fria" que a variante
   filtrada.
2. Aplicar cache/materialização/índice adequado pro caso agregado, com um TTL que aguente
   confortavelmente o auto-refresh de 1min do frontend (ou me avisar se 1min for curto demais pro
   volume de dados, que eu ajusto o intervalo em `hooks/useAutoRefresh.ts`).
3. Confirmar comigo com um teste ao vivo (chamada fria, sem cache aquecido) antes de considerar
   resolvido — só uma chamada quente rápida não prova que o caso frio foi corrigido.
