# Contrato — Vínculo Usuário↔Funcionário e escopo por Setor (RH)

**Objetivo:** vincular um `usuario` (login) a um `funcionario` (RH) e usar o **setor** desse
funcionário para restringir o que ele vê na tela de Funcionários — ex: o gerente de
Logística só enxerga funcionários do setor Logística. Usuário sem funcionário vinculado
não deve ver nenhum funcionário.

Este documento complementa [`contrato-escopo-unidades-rh.md`](./contrato-escopo-unidades-rh.md)
e reaproveita o mesmo mecanismo (`id_usuario_sessao`) já usado ali — não introduz um
parâmetro novo.

---

## 1. Banco de dados

### 1.1 `auth.usuarios.id_funcionario` (já existe)

A coluna já existe e já é usada pelo frontend (`app/(protected)/cadastros/acessos/usuarios/page.tsx`).
Antes, era preenchida por texto livre (UUID digitado à mão, sem validação); agora o
frontend oferece um select vindo de `GET /funcionarios`, então o valor gravado sempre será
o `id` de um funcionário existente (ou `null`). **Não precisa de migration** — só valide
no `PUT/POST /usuarios` que, quando informado, `id_funcionario` referencia um
`core.funcionarios.id` existente (FK, se ainda não houver).

### 1.2 `core.funcionarios.email` (campo novo)

```sql
ALTER TABLE core.funcionarios ADD COLUMN email varchar(255);
```

Usado para identificar o funcionário ao vincular (mostrado no select de "Funcionário
vinculado" da tela de Usuários) e enviado pelo frontend em toda criação/edição de
funcionário a partir de agora. Não precisa ser `NOT NULL`/único a nível de banco — a
validação de formato já acontece no frontend.

---

## 2. API — escopo por setor em `GET /funcionarios`

### 2.1 Regra

Reaproveita o `id_usuario_sessao` que `GET /funcionarios` já recebe (ver
`lib/api/escopoUnidade.ts` e o contrato de unidades). Ao receber essa query string, além do
filtro de unidade já implementado, aplicar:

1. Resolver `id_funcionario = auth.usuarios.id_funcionario` para esse `id_usuario_sessao`.
2. **Se `id_funcionario` for `null`** → retornar lista **vazia** (`total: 0`), independente
   de qualquer outro filtro enviado. Esse é o caso "usuário logou mas não tem funcionário
   vinculado — não deve ver nada".
3. **Se `id_funcionario` estiver preenchido** → resolver o `id_setor` desse funcionário e
   restringir o resultado a `id_setor` igual ao dele (interseção com `id_setor` já enviado
   pelo cliente, se houver, igual já é feito para `codigo_empresa` no escopo de unidade).

### 2.2 Importante — isso é o oposto do default do escopo de unidade

No contrato de unidades, **sem vínculo = irrestrito** (para não quebrar admin/diretoria
que não têm linha em `usuarios_unidades`). Aqui é o contrário: **sem funcionário
vinculado = vazio**, por pedido explícito do negócio. Essa regra vale **só para
`GET /funcionarios`** — não estender a `setores`, `cargos` ou `unidades`, cujos
dropdowns (unidade/setor/cargo) continuam abertos normalmente para montar filtros e
formulários.

Se alguém que hoje é irrestrito por unidade (ex: Admin/Diretoria) também precisar ver
todos os funcionários sem ter um funcionário vinculado, isso precisa de uma regra
explícita de exceção (ex: por perfil) — hoje não há como o frontend sinalizar isso, então
recomendo alinhar antes de implementar caso seja necessário.

### 2.3 Mutações (`POST`, `PUT/DELETE /funcionarios/:id`)

Para não deixar brecha (alguém restrito por setor editando/excluindo um funcionário de
outro setor por ID direto), aplicar a mesma resolução do item 2.1 como validação:
- `POST` — se o usuário tiver `id_funcionario` vinculado, o `id_setor` do corpo deve ser
  igual ao do funcionário vinculado (ou a criação é negada com 403).
- `PUT/DELETE /funcionarios/:id` — o registro-alvo deve ter o mesmo `id_setor` do
  funcionário vinculado ao usuário, senão 403.
- Usuário sem `id_funcionario` vinculado: negar todas as mutações com 403 (consistente com
  "não vê nada" no GET).

```
403 Forbidden
{ "detail": "Setor fora do escopo do usuário" }
```

---

## 3. O que já está pronto no frontend (Next.js)

- `GET /api/funcionarios` já envia `id_usuario_sessao` via `comEscopoUnidade` — nenhuma
  mudança adicional necessária aqui quando o backend implementar o item 2.
- Tela de Usuários (`app/(protected)/cadastros/acessos/usuarios/page.tsx`) já tem o select
  "Funcionário vinculado" alimentado por `GET /funcionarios`, gravando `id_funcionario` como
  `id` real ou `null`.
- Tela de Funcionários já tem o campo `email` no formulário e na listagem.

---

## 4. Rollout sugerido

1. Backend adiciona `core.funcionarios.email` (migration simples, coluna nula).
2. Backend implementa a resolução `usuarios.id_funcionario → funcionarios.id_setor` e o
   filtro do item 2.1 em `GET /funcionarios`, atrás do `id_usuario_sessao` (mesmo parâmetro
   já usado no escopo de unidade — nenhuma mudança de contrato de request).
3. Validar em ambiente de teste com um usuário vinculado a um funcionário de um setor
   específico, e outro sem vínculo algum (deve ver lista vazia).
4. Implementar as validações de mutação do item 2.3.
5. Só depois disso, popular `id_funcionario` para os usuários que devem ficar restritos por
   setor (ex: gerentes) — antes disso, ninguém perde acesso, porque a tabela/coluna nova
   não é usada até o backend aplicar o filtro.
