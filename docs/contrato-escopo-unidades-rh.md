# Contrato — Escopo de acesso por Unidade (RH)

**Objetivo:** permitir que um usuário de RH veja e gerencie apenas os Setores, Cargos e
Funcionários da(s) Unidade(s) pela(s) qual(is) ele é responsável, em vez de todas as
unidades da empresa.

**Situação atual:** `auth.perfis` + `auth.permissoes` controlam **quais telas** e **quais
ações** (`pode_visualizar/criar/editar/deletar`) um perfil pode usar — não filtram
**quais linhas**. Um usuário com acesso à tela "Funcionários" enxerga hoje os
funcionários de todas as unidades.

Este documento é o contrato do que precisa mudar no **banco** e na **API** para viabilizar
o escopo por unidade. O frontend (Next.js) já está preparado para consumir isso — as
mudanças descritas aqui ficam do lado do backend/DBA.

---

## 1. Banco de dados

### 1.1 Nova tabela: `auth.usuarios_unidades`

Relação N:N entre usuário e unidade — um usuário pode ser responsável por uma ou mais
unidades. Segue exatamente o mesmo padrão já usado em `auth.usuarios_perfis` (chave
composta, sem soft delete, `created_at`/`created_by`).

```sql
CREATE TABLE auth.usuarios_unidades (
  id_usuario     uuid NOT NULL REFERENCES auth.usuarios(id) ON DELETE CASCADE,
  codigo_empresa uuid NOT NULL REFERENCES core.unidades(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  created_by     uuid REFERENCES auth.usuarios(id),
  CONSTRAINT pk_usuarios_unidades PRIMARY KEY (id_usuario, codigo_empresa)
);

CREATE INDEX idx_usuarios_unidades_id_usuario     ON auth.usuarios_unidades(id_usuario);
CREATE INDEX idx_usuarios_unidades_codigo_empresa ON auth.usuarios_unidades(codigo_empresa);
```

Por que uma tabela nova em vez de reaproveitar `auth.usuarios.id_funcionario` (que já
aponta para `core.funcionarios.codigo_empresa`): nem todo usuário tem um funcionário
vinculado (ex: contas de admin/dev), e uma pessoa de RH pode ser responsável por mais de
uma unidade (ex: cobrindo a filial além da matriz) sem que isso mude onde ela é
funcionária. Uma tabela dedicada desacopla "onde a pessoa trabalha" de "quais dados ela
pode gerenciar".

### 1.2 Regra de escopo

- Usuário **com** linhas em `usuarios_unidades` → **restrito**: só pode ver/gravar
  registros de `setores`, `cargos`, `funcionarios` (e o próprio `unidades`) onde
  `codigo_empresa` esteja entre as unidades atribuídas a ele.
- Usuário **sem** nenhuma linha em `usuarios_unidades` → **irrestrito** (comportamento
  atual, ex: Admin (Dev), Diretoria). Isso torna o rollout retrocompatível: ninguém perde
  acesso até que alguém seja explicitamente vinculado a uma unidade.

---

## 2. API (api-acos-vital)

### 2.1 Identificação do usuário solicitante

Hoje minhas rotas Next.js chamam o backend só com o header de serviço `x-api-key` —
ele identifica "o Next.js", não a pessoa logada. Para aplicar o escopo por usuário, os
endpoints abaixo precisam receber **quem está pedindo**.

Proposta: novo parâmetro de query `id_usuario_sessao` (uuid), enviado em toda chamada
`GET/POST/PUT/DELETE` a esses recursos. O Next.js já tem esse valor em
`session.user.id_usuario` em cada rota — é só incluir na query string.

- Se `id_usuario_sessao` vier e o usuário tiver linhas em `usuarios_unidades` → aplicar
  filtro `codigo_empresa IN (...)` automaticamente (interseção com qualquer
  `codigo_empresa` já enviado pelo cliente, se houver).
- Se `id_usuario_sessao` não vier, ou o usuário não tiver linhas em
  `usuarios_unidades` → comportamento atual (sem filtro).

### 2.2 Endpoints afetados

| Endpoint | Mudança |
|---|---|
| `GET /unidades` | filtra a lista pelas unidades do usuário, se restrito |
| `GET/POST /setores`, `GET/POST /cargos`, `GET/POST /funcionarios` | `GET` filtra por unidade; `POST` valida que o `codigo_empresa` do corpo está no escopo do usuário |
| `PUT/DELETE /setores/:id`, `/cargos/:id`, `/funcionarios/:id` | valida que o `codigo_empresa` do registro está no escopo antes de editar/excluir |

### 2.3 Contrato de erro

Quando um usuário restrito tentar ler/gravar um registro fora do seu escopo:

```
403 Forbidden
{ "detail": "Unidade fora do escopo do usuário" }
```

### 2.4 Endpoints novos — gerenciar a atribuição

Para que alguém (ex: um admin) defina quais unidades um usuário gerencia:

```
GET  /usuarios/:id_usuario/unidades          → lista de codigo_empresa atribuídos
PUT  /usuarios/:id_usuario/unidades          → substitui a lista inteira
     body: { "unidades": ["<uuid>", "<uuid>", ...] }
```

O formato "substitui tudo" (`PUT` com a lista completa) foi escolhido por ser mais simples
de ligar a um multi-select no frontend — mesmo padrão que a tela de Permissões já usa em
lote.

---

## 3. O que muda no frontend (Next.js) — sem ação do DBA

Assim que o backend implementar o item 2, eu ajusto as rotas
`app/api/{unidades,setores,cargos,funcionarios}/route.ts` para sempre enviar
`id_usuario_sessao=session.user.id_usuario`. As telas de Setores, Cargos e Funcionários
não precisam mudar — o filtro é transparente. Só preciso adicionar uma tela pequena (ou um
campo na tela de Usuários) para chamar o `PUT /usuarios/:id/unidades`.

---

## 4. Rollout sugerido

1. DBA aplica a migration da tabela `auth.usuarios_unidades` (item 1.1) — não quebra nada,
   tabela vazia não muda comportamento de ninguém.
2. Backend implementa o filtro (item 2) — como a regra só ativa para quem tem linha na
   tabela, ainda não muda nada em produção.
3. Eu ajusto o Next.js para mandar `id_usuario_sessao`.
4. Só então alguém popula `usuarios_unidades` para os usuários de RH que devem ser
   restritos — a partir daí o escopo passa a valer para eles.
