# Contrato — Vínculo Vendedor (Omie) ↔ Funcionário (RH)

**Objetivo:** ligar cada linha de `core_vendas_faturamento.vendedores` (uma por conta Omie —
Mogi e Uberaba) ao `core.funcionarios` correspondente, de forma que os ~5 vendedores que
vendem nas duas contas apontem para o **mesmo** funcionário, e o ranking/detalhe de
vendas-faturamento passe a enxergar cargo, setor e unidade de RH — sem depender mais de
`pessoa_vendedor` (tabela solta, mantida por texto, sem ligação com RH).

**Atualização:** o primeiro rascunho deste contrato (e o protótipo em
[`vinculo-vendedores-prototipo.html`](./vinculo-vendedores-prototipo.html)) supunha que não
existia nenhuma tela de vendedores no Hub. Não é o caso — `vendas/vendedores` já é uma tela
de CRUD completa, em produção, com `app/api/vendedores` (GET/POST) e
`app/api/vendedores/[id]` (PUT/DELETE) já funcionando, e o tipo `VendedorCadastroProps` já
tem `id_funcionario` (só não exposto na UI ainda). Isso reduz bastante o que falta: em vez de
uma tela nova com endpoints novos, é um campo a mais no formulário que já existe. O
protótipo HTML continua útil como referência de UX pra uma eventual "fila de triagem" em
lote (fase 2, ver item 6) — não é mais o plano imediato.

---

## 1. Banco de dados

### 1.1 Nenhuma coluna nova — o link já existe

`core_vendas_faturamento.vendedores.id_funcionario` já existe, com FK e índice:

```sql
-- já existe hoje, conferido no dump de 02/09:
ALTER TABLE core_vendas_faturamento.vendedores
  ADD CONSTRAINT fk_vendedores_id_funcionario
  FOREIGN KEY (id_funcionario) REFERENCES core.funcionarios(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX idx_vendedores_id_funcionario
  ON core_vendas_faturamento.vendedores (id_funcionario);
```

Sem UNIQUE nela de propósito — várias linhas de `vendedores` (Mogi + Uberaba) podem apontar
pro mesmo `id_funcionario`. Nenhuma migration de schema é necessária pra este contrato.

### 1.2 Backfill — popula o que já dá pra inferir do `pessoa_vendedor` atual

Roda uma vez, antes do backend trocar o JOIN (item 2). Não é destrutivo: só preenche
`id_funcionario` onde hoje está `NULL`, usando o nome já mapeado em `pessoa_vendedor`.

```sql
-- 1) Cria funcionário pra quem já tem "pessoa_vendedor" mas ainda não tem
--    core.funcionarios (heurística por nome — o que não bater cai na fila da tela, item 4)
INSERT INTO core.funcionarios (nome_completo, id_cargo, id_setor, codigo_empresa)
SELECT DISTINCT pv.nome, :id_cargo_vendedor, :id_setor_vendas, v.codigo_empresa
FROM core_vendas_faturamento.pessoa_vendedor pv
JOIN LATERAL unnest(pv.codigos_vendedor) AS codigo(val) ON TRUE
JOIN core_vendas_faturamento.vendedores v
  ON v.codigo_empresa::text || ':' || v.codigo_vendedor_omie = codigo.val
WHERE pv.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM core.funcionarios f WHERE f.nome_completo = pv.nome
  );

-- 2) Aponta cada linha de vendedores pro funcionario correspondente
UPDATE core_vendas_faturamento.vendedores v
SET id_funcionario = f.id
FROM core_vendas_faturamento.pessoa_vendedor pv
JOIN LATERAL unnest(pv.codigos_vendedor) AS codigo(val) ON TRUE
JOIN core.funcionarios f ON f.nome_completo = pv.nome
WHERE pv.deleted_at IS NULL
  AND v.codigo_empresa::text || ':' || v.codigo_vendedor_omie = codigo.val
  AND v.id_funcionario IS NULL;
```

`:id_cargo_vendedor` / `:id_setor_vendas` — o `id` de um cargo/setor "Vendedor" existente,
por unidade. Se não houver um cargo genérico assim hoje, me avisa que eu confirmo com vocês
qual usar antes do backfill rodar (não quero inventar cargo/setor sem confirmação).

### 1.3 O que sobra vira a fila da tela

Toda linha de `vendedores` com `id_funcionario IS NULL` depois do backfill é exatamente a
lista inicial que a tela de vínculo (item 4) mostra como "Pendente" — nada se perde, só
falta decisão humana pra quem o nome não bateu automaticamente.

---

## 2. Funções de banco — trocar o JOIN

`fn_ranking_vendedores_vendas`, `fn_ranking_vendedores_faturamento`,
`fn_detalhe_vendedor_vendas`, `fn_detalhe_vendedor_faturamento` (todas em
`core_vendas_faturamento`) hoje juntam por `pessoa_vendedor` via array de texto. Trocar pelo
JOIN direto em `vendedores.id_funcionario`:

```sql
-- ANTES (nas 4 funções, mesmo padrão):
LEFT JOIN core_vendas_faturamento.pessoa_vendedor pv
  ON (b.codigo_empresa::text || ':' || b.cod_vendedor) = ANY (pv.codigos_vendedor)
  AND pv.deleted_at IS NULL
-- identidade = COALESCE(pv.id::text, 'sem_mapa:'||empresa||':'||codigo)
-- vendedor   = COALESCE(pv.nome, b.vendedor)

-- DEPOIS:
LEFT JOIN core_vendas_faturamento.vendedores vd
  ON vd.codigo_empresa = b.codigo_empresa AND vd.codigo_vendedor_omie = b.cod_vendedor
LEFT JOIN core.funcionarios f ON f.id = vd.id_funcionario
-- identidade = COALESCE(vd.id_funcionario::text, 'sem_mapa:'||empresa||':'||codigo)
-- vendedor   = COALESCE(f.nome_completo, b.vendedor)
-- de graça: f.id_cargo, f.id_setor, f.codigo_empresa (unidade "de casa")
```

Os campos de retorno das 4 funções continuam os mesmos (`id_pessoa`, `vendedor`,
`codigos_vendedor`, `empresas` etc.) — só a fonte do JOIN muda, então o contrato com o
frontend (`RankingVendedoresVendasProps` e afins) não precisa mudar nada.

**Rollout sugerido pra essa troca:** rodar as duas versões em paralelo (uma view de
comparação `id_pessoa` antigo vs. `id_funcionario` novo) por um mês fechado, conferir que os
totais batem, só então trocar as 4 funções de vez. `pessoa_vendedor` fica arquivada (não
dropar ainda) até essa confirmação.

---

## 3. API (api-acos-vital) — o que já existe vs. o que falta

`GET /vendedores`, `POST /vendedores` e `PUT /vendedores/:id` (id = uuid da linha, não
`codigo_empresa`+`codigo_vendedor_omie`) já existem e já são usados pela tela
`vendas/vendedores` — nada disso é novo. O que preciso confirmar com vocês:

| O que | Status | Ação do backend |
|---|---|---|
| `GET /vendedores` devolver `id_funcionario` por linha | Já existe no tipo do frontend (`VendedorCadastroProps.id_funcionario`) | Confirmar que o `SELECT` já inclui a coluna (deveria, ela existe na tabela) |
| `PUT /vendedores/:id` aceitar `id_funcionario` no body (`uuid \| null`) | **A confirmar** | Garantir que o `UPDATE` grava essa coluna quando o campo vier no payload — `null` explícito precisa limpar o vínculo, não ser ignorado |
| `POST /vendedores` aceitar `id_funcionario` opcional no body | **A confirmar** | Mesma coisa, pro caso raro de cadastro manual já vincular na criação |

Pro `PUT`/`POST` acima, as rotas Next.js (`app/api/vendedores/route.ts`,
`app/api/vendedores/[id]/route.ts`) já repassam o corpo da requisição sem transformá-lo.
Assim que o backend aceitar o campo, ele flui automaticamente — nenhuma mudança de código
no Next.js pra isso.

### 3.1 Endpoint novo — sugestão de vínculo

A sugestão de "mesmo nome em outra unidade" (o caso dos ~5 vendedores nos dois Omies) **é
uma consulta no banco, não uma comparação de string no frontend** — carregar todos os
vendedores no navegador só pra comparar nomes ali seria gambiarra. Endpoint novo:

```
GET /vendedores/:id/sugestoes
→ 200 { "sugestao": { "id_funcionario": "uuid", "nome_funcionario": "text",
                       "codigo_empresa_origem": "uuid" } | null }
```

Consulta de referência (mesmo nome, unaccent + lower, em outra unidade, já vinculado):

```sql
SELECT v2.id_funcionario, f.nome_completo, v2.codigo_empresa AS codigo_empresa_origem
FROM core_vendas_faturamento.vendedores v1
JOIN core_vendas_faturamento.vendedores v2
  ON v2.codigo_empresa <> v1.codigo_empresa
  AND unaccent(lower(v2.nome)) = unaccent(lower(v1.nome))
  AND v2.id_funcionario IS NOT NULL
JOIN core.funcionarios f ON f.id = v2.id_funcionario
WHERE v1.id = :id AND v1.id_funcionario IS NULL
LIMIT 1;
```

Se `pg_trgm` já estiver habilitada no banco, dá pra evoluir depois pra "nome parecido" (não
só idêntico) via `similarity()` — não é bloqueio pra essa primeira versão, que já cobre o
caso concreto que motivou tudo isso (nome idêntico entre as duas contas).

### 3.2 Contrato de erro

```
409 { "detail": "id_funcionario não existe ou está com deleted_at preenchido" }
```

---

## 4. O que muda no frontend — sem ação do DBA além do item 3 acima

- **Não é uma tela nova.** Estendo `app/(protected)/vendas/vendedores/page.tsx`, que já existe:
  - Campo "Funcionário Vinculado" (Autocomplete, mesmo padrão do campo "Usuário Vinculado"
    que já existe ali) no modal de criar/editar.
  - Coluna "Funcionário" na tabela/lista mobile, mostrando o nome vinculado ou "—".
  - Sugestão automática: chama `GET /vendedores/:id/sugestoes` (item 3.1) quando o modal
    abre pra um vendedor sem vínculo; se vier sugestão, mostra um atalho "usar o mesmo
    funcionário" — cobre o caso dos ~5 vendedores nos dois Omies. Até o endpoint existir,
    a chamada falha em silêncio (sem toast de erro) e simplesmente não aparece sugestão —
    o campo de vínculo manual continua funcionando normalmente.
- Nenhum item de menu novo, nenhuma permissão nova — reaproveita a tela e a permissão
  `vendedores` que já existem.

---

## 5. Rollout sugerido

1. DBA roda o backfill do item 1.2 (não muda nada em produção — só preenche `id_funcionario`
   onde já dava pra inferir pelo nome).
2. Backend confirma/ajusta o `PUT`/`POST /vendedores` (provavelmente pequeno — pode já
   funcionar, é só confirmar) e implementa `GET /vendedores/:id/sugestoes` (item 3.1).
3. Eu ligo o campo e a sugestão na tela existente — dá pra fechar o vínculo de quem sobrou
   da fila (item 1.3) direto por ali, sem SQL manual.
4. Só depois de um mês fechado com a view de comparação do item 2 batendo 100%, o backend
   troca o JOIN das 4 funções de ranking e a gente decide juntos quando arquivar
   `pessoa_vendedor`.

## 6. Fase 2 (não agora): fila de triagem em lote

Pra quando sobrar volume grande de vendedores sem vínculo (hoje dá pra resolver um a um na
tela normal), o protótipo em
[`vinculo-vendedores-prototipo.html`](./vinculo-vendedores-prototipo.html) mostra como seria
uma tela dedicada de triagem em lote (lista filtrável Pendente/Vinculado, sugestão de match
com CTA de um clique, criar funcionário direto do fluxo). Fica registrado como referência,
não como próximo passo.
