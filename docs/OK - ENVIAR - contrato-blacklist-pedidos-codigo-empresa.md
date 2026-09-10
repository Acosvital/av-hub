# Bug de backend — `POST /blacklist_pedidos` sempre falha (`codigo_empresa` é obrigatório na tabela, mas não existe no model nem na rota)

**Criado em:** 09/09/2026, a partir da tela nova "Blacklist de Pedidos" (av-hub,
`/cadastros/auxiliares/blacklist_pedidos`) — Nathan tentou bloquear o pedido **27611**
e recebeu erro ao salvar, mesmo preenchendo tudo que a tela pedia.

**Status:** não é bug no av-hub. A tabela `core_vendas_faturamento.blacklist_pedidos`
tem uma coluna `codigo_empresa uuid NOT NULL` que **nem o model Sequelize nem a rota da
API sabem que existe** — qualquer tentativa de criar um registro é descartada antes de
chegar no banco, então o `NOT NULL` da coluna sempre estoura. Isso não tem correção
possível pelo frontend: o campo precisa ser aceito pela API pra poder ser enviado.

---

## 1. Evidência — o campo é descartado mesmo quando enviado

```
POST /blacklist_pedidos
Body: { "numero_pedido": "27611", "motivo": "teste" }
→ 400 { "detail": "Campo obrigatório não informado: codigo_empresa" }
```

Até aqui parece só faltar mandar o campo. Mas mandando explicitamente:

```
POST /blacklist_pedidos
Body: { "numero_pedido": "27611", "codigo_empresa": "759979bd-2b2d-41f2-b1b7-db6fae89ee59" }
→ 400 { "detail": "Campo obrigatório não informado: codigo_empresa" }   ← MESMO ERRO
```

**O erro é idêntico com ou sem o campo no corpo da requisição** — ou seja, a API não
está lendo `codigo_empresa` de jeito nenhum, ele é descartado antes de validar.

## 2. Causa raiz

`src/models/blacklist_pedido.js` define só duas colunas:

```js
const BlacklistPedido = sequelize.define("BlacklistPedido", {
  numero_pedido: { type: DataTypes.TEXT, primaryKey: true, allowNull: false },
  motivo:        { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "blacklist_pedidos", schema: "core_vendas_faturamento", ... });
```

Mas a tabela real (`\d core_vendas_faturamento.blacklist_pedidos`) tem uma coluna a mais:

```sql
CREATE TABLE core_vendas_faturamento.blacklist_pedidos (
    numero_pedido text NOT NULL,
    motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    codigo_empresa uuid NOT NULL          -- ← não existe no model
);
```

E `src/routes/blacklist_pedidos.js` tem uma lista própria de campos aceitos, que
também não inclui `codigo_empresa`:

```js
const FIELDS = ["numero_pedido", "motivo"];   // ← falta codigo_empresa aqui também
const pick = (fields) => (body) => fields.reduce((acc, k) => {
  const val = body[k];
  if (val !== undefined) acc[k] = val;
  return acc;
}, {});
router.post("/", async (req, res) => {
  const data = pick(FIELDS)(req.body);   // codigo_empresa é descartado aqui
  const record = await BlacklistPedido.create(data);
  ...
});
```

Então mesmo que o cliente mande `codigo_empresa`, o `pick(FIELDS)` já remove esse campo
do objeto antes de chegar no `.create()` — e, mesmo que não removesse, o model não
declara essa coluna, então o Sequelize não a incluiria no INSERT de qualquer forma.
Dois pontos de descarte independentes, os dois precisam ser corrigidos.

**Por que essa coluna existe na tabela:** `numero_pedido` não é único entre empresas —
confirmei que o pedido **27611**, por exemplo, existe pra empresa
`759979bd-2b2d-41f2-b1b7-db6fae89ee59` (Aços Vital). Se duas unidades tiverem um pedido
com o mesmo número, bloquear só por `numero_pedido` bloquearia o pedido errado também —
por isso a tabela foi desenhada exigindo a unidade.

## 3. `blacklist_vendedores` (a outra tela nova) — não tem esse problema

Testei o mesmo tipo de INSERT em `/blacklist_vendedores` e funcionou normal:

```
POST /blacklist_vendedores
Body: { "nome_vendedor": "TESTE DEBUG", "motivo": "teste" }
→ 201 { "nome_vendedor": "TESTE DEBUG", "motivo": "teste", "created_at": "..." }
```

Confirmei a tabela real também — `blacklist_vendedores` **não tem** coluna `codigo_empresa`,
só `nome_vendedor` + `motivo` (bate com o model). Esse fluxo já funciona, não precisa
de nenhuma mudança.

## 4. O que precisa mudar (backend)

Dois arquivos, mudança pequena e isolada:

**`src/models/blacklist_pedido.js`** — adicionar a coluna que já existe na tabela:

```js
const BlacklistPedido = sequelize.define("BlacklistPedido", {
  numero_pedido:  { type: DataTypes.TEXT, primaryKey: true, allowNull: false },
  codigo_empresa: { type: DataTypes.UUID, allowNull: false },   // NOVO
  motivo:         { type: DataTypes.TEXT, allowNull: true },
}, { ... });
```

**`src/routes/blacklist_pedidos.js`** — aceitar o campo na criação/atualização e no filtro de listagem:

```js
const FIELDS = ["numero_pedido", "codigo_empresa", "motivo"];   // adicionar codigo_empresa
// UPDATE_FIELDS pode continuar sem codigo_empresa (é imutável — ver seção 5)

// no GET /, seria útil também aceitar filtro:
if (req.query.codigo_empresa) where.codigo_empresa = req.query.codigo_empresa;
```

Também vale considerar se a **chave primária** deveria ser composta
(`numero_pedido` + `codigo_empresa`) em vez de só `numero_pedido` — do jeito que o model
está hoje (`primaryKey: true` só em `numero_pedido`), um `findByPk` faria a rota de
`GET/PUT/DELETE /blacklist_pedidos/:numero_pedido` encontrar **qualquer** linha com
aquele número, ignorando a empresa, se dois pedidos de empresas diferentes algum dia
tiverem o mesmo número — o mesmo problema que a coluna `codigo_empresa` foi criada pra
evitar, só que na ponta de busca/edição em vez da de criação. Não bloqueia a correção
acima, mas é uma inconsistência que vale revisar junto.

## 5. Já ajustado no av-hub, esperando esse fix

A tela `/cadastros/auxiliares/blacklist_pedidos` já tem um campo "Unidade"
(obrigatório, trava depois de criado) que manda `codigo_empresa` no `POST` — só vai
funcionar de fato depois da correção acima. Sem mudança nenhuma necessária no frontend
depois que o backend aceitar o campo.

## 6. Contrato de API — chamadas usadas nesta investigação

Todas contra `https://api.acosvital.com.br`, header `x-api-key`.

| Propósito | Chamada |
|---|---|
| Reproduz o erro sem o campo | `POST /blacklist_pedidos` `{"numero_pedido":"27611","motivo":"teste"}` → 400 |
| Reproduz o MESMO erro mandando o campo (prova que é descartado) | `POST /blacklist_pedidos` `{"numero_pedido":"27611","codigo_empresa":"759979bd-..."}` → 400, mensagem idêntica |
| Confirma que blacklist_vendedores funciona sem esse problema | `POST /blacklist_vendedores` `{"nome_vendedor":"TESTE DEBUG","motivo":"teste"}` → 201 |
| Confirma a qual empresa pertence o pedido 27611 | `GET /vendas_planilha?pedido_venda=27611` → `codigo_empresa: "759979bd-2b2d-41f2-b1b7-db6fae89ee59"` (Aços Vital) |
| Confirma o schema real da tabela | `pg_dump --schema-only` (dump `dump-avhub_prd_db-202609090728.sql` fornecido por Nathan), linha 5753 |
