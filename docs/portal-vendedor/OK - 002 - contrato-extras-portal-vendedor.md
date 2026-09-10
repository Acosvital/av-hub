# Contrato — Clientes inativos, favoritos e histórico de status

**✅ Implementado (04/09) — confirmado ao vivo os 3 endpoints:**
- `GET /clientes_inativos?cod_vendedor=...&dias_sem_comprar=...` → 13 registros reais retornados.
- `GET/POST/DELETE /usuarios/:id_usuario/favoritos` → valida usuário real (`404 "Usuário não
  encontrado"` pra um uuid inventado, confirmando que a rota existe e resolve de verdade).
- `GET /pedidos_vendas/:codigo_pedido_omie/status-historico` → `{codigo_pedido_omie,
  pedido_existe, total, historico}`, vazio como esperado (só captura mudança a partir de agora).

Nenhum dos 3 está implementado no frontend ainda — ficam pra quando entrarem na fila de extras
(seção 8 do plano).

**Objetivo:** viabilizar 3 melhorias do `docs/portal-vendedor/plano-portal-vendedor.md` (seção 8) que hoje não
dão pra fazer só no frontend: cliente inativo (8.9), favoritar cliente/pedido (8.10) e histórico
de status do pedido (8.11). Estes precisam de trabalho de banco/API de verdade — este documento
é esse pedido.

**Correção (04/09):** este contrato tinha uma seção 1 pedindo tabela nova + sync com a Omie pra
"top produtos vendidos" (item 8.12), escrita a partir só do catálogo de APIs da Omie, sem acesso
ao código-fonte real da API. Com acesso direto ao repositório (`api-acos-vital-main`), confirmei
que **isso já existe** — ver `docs/portal-vendedor/plano-portal-vendedor.md` seção 8.12 (atualizada) e o motivo
abaixo. Removi a seção daqui porque não é mais um pedido de trabalho novo.

> **Nota sobre top produtos vendidos (8.12):** existe uma view real,
> `core_vendas_faturamento.vw_pedido_venda_itens`, já exposta via `GET /pedido_venda_itens`
> (lista plana, aceita `codigo_vendedor_omie`, `data_inicio`/`data_fim`, `codigo_produto`, etc.,
> paginada) e `GET /pedido_venda_itens/{numero_pedido}` (pedido com produtos aninhados). Cada
> linha já traz `codigo_produto`, `descricao` (resolvida de `core.produtos`), `quantidade`,
> `valor_unitario`, `valor_total`, `ncm`, `cfop`, e o vínculo à nota (`numero_nf`,
> `codigo_nf_omie`) quando faturado. "Top produtos do vendedor" dá pra montar agregando essa
> rota no frontend (ou, se o volume por mês justificar, pedindo um `GET /ranking_produtos_vendas`
> que agregue no banco — mas isso é otimização, não um bloqueio como eu tinha avaliado antes).
> Nenhuma tabela nova, nenhum sync novo com a Omie necessário.

**Como foi levantado (itens 2-4 abaixo):** consultei o catálogo oficial de APIs da Omie
(`https://developer.omie.com.br/service-list/`) pra confirmar **onde** cada dado que falta já
existe (ou não) na origem, antes de pedir qualquer coisa nova.

---

## 1. Cliente inativo (sem comprar há X dias)

### 1.1 Situação atual

**Isso não depende da Omie nem de sync novo** — os pedidos já ficam
guardados no nosso banco indefinidamente (não é uma janela de "só o mês corrente"), só que
todo endpoint de consulta hoje é recortado por `mes`/`ano`. O dado pra responder "quando foi a
última compra desse cliente" já está todo lá, só falta uma consulta que olhe pra trás no tempo
em vez de pra um mês fixo.

### 1.2 API nova

```
GET /clientes_inativos?cod_vendedor=<X>&dias_sem_comprar=<N>&codigo_empresa=<opcional>
→ [
    { "codigo_cliente": "...", "cliente": "...", "ultima_compra": "2026-06-12",
      "dias_sem_comprar": 84, "valor_ultima_compra": "5210.00" },
    ...
  ]
```

### 1.3 SQL — sketch

```sql
-- Pseudocódigo — última data de pedido por cliente daquele vendedor,
-- filtrado pra quem já passou de N dias sem novo pedido.
SELECT
  p.codigo_cliente,
  MAX(p.data_inclusao) AS ultima_compra,
  (CURRENT_DATE - MAX(p.data_inclusao)) AS dias_sem_comprar
FROM core_vendas_faturamento.pedidos_vendas p
WHERE p.cod_vendedor = :cod_vendedor
  AND p.deleted_at IS NULL
GROUP BY p.codigo_cliente
HAVING (CURRENT_DATE - MAX(p.data_inclusao)) >= :dias_sem_comprar
ORDER BY ultima_compra ASC;
```

Sem tabela nova — é uma função/view nova sobre um dado que já existe. O mais barato dos 3
itens deste documento.

---

## 2. Favoritar cliente ou pedido

### 2.1 Por que precisa de tabela (não dá em `localStorage` de verdade)

`localStorage` resolve o caso de uso básico, mas não sincroniza entre o computador do
escritório e o celular do vendedor, e some se ele limpar os dados do navegador — daí a
tabela.

### 2.2 SQL

```sql
CREATE TABLE IF NOT EXISTS auth.usuarios_favoritos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario    uuid NOT NULL REFERENCES auth.usuarios (id) ON DELETE CASCADE,
  tipo          text NOT NULL CHECK (tipo IN ('cliente', 'pedido')),
  referencia_id text NOT NULL,  -- codigo_cliente ou codigo_pedido_omie, conforme `tipo`
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_usuarios_favoritos UNIQUE (id_usuario, tipo, referencia_id)
);
```

`referencia_id` como texto genérico (não FK) porque aponta pra coisas de tabelas diferentes
dependendo do `tipo` — mais simples que duas colunas nullable ou duas tabelas separadas pra um
caso de uso pequeno.

### 2.3 API nova

```
GET    /usuarios/:id_usuario/favoritos                → lista de favoritos do usuário
POST   /usuarios/:id_usuario/favoritos                → { tipo, referencia_id }
DELETE /usuarios/:id_usuario/favoritos/:id             → remove um favorito
```

Mesmo padrão de sub-recurso já usado em `usuarios/:id/unidades` (contrato de escopo por
unidade, já implementado).

**⚠️ Bug confirmado ao vivo (04/09) — `POST /usuarios/:id_usuario/favoritos` está quebrado.**
A implementação real diverge do contrato em dois pontos que já contornei no frontend:
- Exige `codigo_empresa` no corpo (uuid da unidade) — não estava no contrato original, mas faz
  sentido (`referencia_id` só é único dentro de uma unidade). **Já ajustado** no frontend.
- Exige um campo `id` no corpo (a tabela real não tem `DEFAULT gen_random_uuid()` como o SQL do
  contrato sugeria) — **mas mesmo enviando um uuid válido em `id`, a rota continua respondendo
  `400 {"detail":"Campo obrigatório não informado: id"}`**. Testei ao vivo, direto contra o
  backend (sem passar pelo av-hub), variando `id` como uuid, como a mesma string de
  `referencia_id`, com `tipo=cliente` e `tipo=pedido` — sempre o mesmo erro, mesmo com o campo
  presente e preenchido. GET e DELETE não têm esse problema (GET só devolve com a chave
  `favoritos` em vez de `data`, também já ajustado no frontend).

**Ação necessária:** revisar a validação de `POST /usuarios/:id_usuario/favoritos` — provavelmente
está checando o campo errado (talvez confundindo com o `:id_usuario` do path, ou uma condição
de validação que nunca passa). O frontend (`app/api/meus-favoritos/route.ts`) já está pronto
pra funcionar assim que isso for corrigido — não precisa de mudança nenhuma do lado do av-hub.

---

## 3. Histórico de status do pedido

### 3.1 Situação atual

Nem no nosso banco nem na Omie existe um log de toda transição de status — a Omie também não
lista isso no catálogo (o mais próximo é "Pedidos de Venda - Etapas", que é só o **dicionário**
das etapas possíveis, não um histórico de quando um pedido específico passou por cada uma).
Isso precisa nascer aqui, capturado no momento em que sincronizamos os dados da Omie pra cá.

### 3.2 SQL

```sql
CREATE TABLE IF NOT EXISTS core_vendas_faturamento.pedidos_vendas_status_historico (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_pedido_omie  text NOT NULL REFERENCES core_vendas_faturamento.pedidos_vendas (codigo_pedido_omie),
  situacao_anterior   text,
  situacao_nova       text NOT NULL,
  detectado_em        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pedidos_status_historico_codigo_pedido
  ON core_vendas_faturamento.pedidos_vendas_status_historico (codigo_pedido_omie);
```

`situacao_anterior` nullable pra cobrir a primeira linha (quando o pedido é sincronizado pela
primeira vez, não tem "anterior").

### 3.3 Onde isso é gravado

Não é uma rota nova pro av-hub chamar — é o **processo de sincronização** (o job que já traz
pedidos da Omie pro nosso banco periodicamente) que precisa comparar a `situacao` antes/depois
de cada sync e, se mudou, inserir uma linha aqui. Esse job já roda e já sabe o valor antigo
(porque faz um UPDATE) — só falta, no mesmo UPDATE, checar se `situacao` mudou e gravar a
transição.

### 3.4 API nova

```
GET /pedidos_vendas/:codigo_pedido_omie/status-historico
→ [
    { "situacao_anterior": null, "situacao_nova": "Pendente", "detectado_em": "2026-08-24T11:22:00Z" },
    { "situacao_anterior": "Pendente", "situacao_nova": "Faturado", "detectado_em": "2026-09-02T08:32:00Z" }
  ]
```

### 3.5 Limitação, mesmo depois de implementado

Só captura mudanças **a partir de quando essa tabela existir** — pedidos já faturados hoje não
ganham histórico retroativo (a Omie não expõe isso, e nosso sync também nunca guardou). Vale
deixar claro pra quem for usar: "histórico de status" só existe pra pedidos que mudarem de
estado depois do deploy dessa mudança.

---

## 4. Rollout sugerido

1. **Item 1 (clientes inativos)** primeiro — mais barato, sem tabela nova, sem sync novo.
2. **Item 2 (favoritos)** em paralelo — tabela pequena e independente, não mexe em sync.
3. **Item 3 (histórico de status)** por último — único que exige tocar no job de sincronização
   com a Omie.
