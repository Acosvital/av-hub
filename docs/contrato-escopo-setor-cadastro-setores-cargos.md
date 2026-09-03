# Contrato — Escopo por Setor nas telas de Setores e Cargos (Cadastros)

**Objetivo:** hoje o escopo por setor (ver [`contrato-escopo-setor-rh.md`](./contrato-escopo-setor-rh.md))
só vale para `GET/POST/PUT/DELETE /funcionarios` — nas telas de **Setores** e **Cargos**
(`Cadastros > Auxiliares`), qualquer usuário com permissão na tela vê e edita tudo da
empresa, independente do setor a que está vinculado. Esse documento estende o mesmo
mecanismo pra essas duas telas: um usuário vinculado a um funcionário de um setor
específico só pode **ver e editar o próprio setor**, e só pode **ver e editar cargos
daquele setor**.

Reaproveita tudo que já existe: `id_usuario_sessao` (já enviado por
`comEscopoUnidade` em `GET/POST /setores` e `GET/POST /cargos`), a resolução
`usuarios.id_funcionario → funcionarios.id_setor` e a flag `setor_irrestrito` (ambas de
[`contrato-escopo-setor-rh.md`](./contrato-escopo-setor-rh.md) e
[`contrato-override-setor-usuario-rh.md`](./contrato-override-setor-usuario-rh.md)). Não
introduz parâmetro novo de request.

---

## 1. Banco de dados

### 1.1 Nova coluna: `core.cargos.id_setor`

```sql
ALTER TABLE core.cargos ADD COLUMN id_setor uuid REFERENCES core.setores(id);
```

**Mudança de modelo:** hoje `cargo` é um catálogo por empresa (`codigo_empresa`), sem
relação com setor — quem liga cargo a setor é o funcionário (que tem os dois campos
separados). Essa migration muda isso: cargo passa a pertencer a **um** setor específico.

- Nasce **nullable** — cargos existentes ficam com `id_setor = null` até o backfill.
- Backfill sugerido: para cada cargo, inferir o setor a partir do setor mais frequente
  entre os funcionários que hoje têm aquele `id_cargo` (ou, na ausência de dado
  suficiente, alinhar manualmente com o RH antes de tornar a coluna obrigatória).
- Depois do backfill, avaliar se vale tornar `NOT NULL` — enquanto for nullable, cargo
  sem `id_setor` deve ser tratado como fora do escopo de qualquer usuário restrito por
  setor (não aparece pra eles, e não pode ser editado por eles), só visível/editável por
  quem for `setor_irrestrito` ou irrestrito por não ter funcionário vinculado.

---

## 2. API — escopo por setor em `GET/POST/PUT/DELETE /setores` e `/cargos`

Mesma resolução de `contrato-escopo-setor-rh.md` (item 2.1), aplicada a essas duas
rotas em vez de só `/funcionarios`:

1. Resolver `setor_irrestrito` de `auth.usuarios` para o `id_usuario_sessao` recebido.
   Se `true` → sem filtro nenhum (irrestrito), igual já vale para funcionários.
2. Senão, resolver `id_funcionario = auth.usuarios.id_funcionario`.
   - `id_funcionario` nulo → lista **vazia** em `GET`, e todas as mutações negadas com
     403 (mesma regra de "sem vínculo = nada" já usada em funcionários).
   - `id_funcionario` preenchido → resolver `id_setor` desse funcionário e restringir:

### 2.1 `GET /setores`

Filtra o resultado ao setor do usuário **e à sua subárvore** (ver seção 3 — não é
filtro por `codigo_empresa` como o escopo de unidade já faz, é pelo(s) `id` de setor
resolvido(s) via hierarquia). O frontend não precisa de paginação especial pra isso — a
listagem já lida com N linhas normalmente.

### 2.2 `PUT /setores/:id` e `DELETE /setores/:id`

Registro-alvo deve ter `id = id_setor_do_usuário`, senão 403.

### 2.3 `POST /setores` (criar setor novo)

Como o gerente de um setor-pai gerencia a subárvore inteira (seção 3), faz sentido ele
poder criar **subsetores dentro da própria árvore**: validar que `parent_id` do corpo
está entre `{id_setor_do_usuário} ∪ subárvore dele` (mesmo conjunto resolvido no item
2.1). Criar um setor **fora** dessa árvore (ex: `parent_id` nulo, ou de outro ramo) segue
negado com 403, exceto para `setor_irrestrito = true`.

### 2.4 `GET /cargos`

Mesma regra: filtra por `id_setor = id_setor_do_usuário` (usa a coluna nova do item 1.1).
Cargos com `id_setor = null` não aparecem pra usuário restrito.

### 2.5 `POST /cargos`

Corpo deve incluir `id_setor`, e ele precisa ser igual ao `id_setor` do usuário (senão
403). Para usuário irrestrito (por unidade ou por `setor_irrestrito`), `id_setor`
continua obrigatório no corpo, só sem a validação de igualdade.

### 2.6 `PUT /cargos/:id` e `DELETE /cargos/:id`

Registro-alvo deve ter `id_setor = id_setor_do_usuário`, senão 403.

### 2.7 Contrato de erro

Mesmo formato já usado nos outros dois contratos de escopo:

```
403 Forbidden
{ "detail": "Setor fora do escopo do usuário" }
```

---

## 3. Hierarquia de setores — confirmado: inclui subsetores

`core.setores` tem `parent_id`/`nivel` (hierarquia). **Confirmado com o negócio:** o
gerente de um setor-pai também gerencia os setores-filho — o escopo **não** é o `id`
exato, e sim toda a subárvore a partir do `id_setor` do funcionário vinculado ao usuário.

Isso muda a resolução do item 2: em vez de `id_setor = <id do usuário>` (igualdade),
os itens 2.1, 2.2, 2.4, 2.5 e 2.6 devem considerar
`id_setor IN (<id do usuário> + todos os descendentes dele em core.setores via parent_id)`
— uma CTE recursiva (`WITH RECURSIVE`) resolvendo a subárvore a partir do setor do
usuário, aplicada como filtro (`GET`) ou validação de pertencimento (`PUT`/`DELETE`/
`POST`).

Consequência prática: para um usuário que gerencia um setor com filhos, `GET /setores`
pode retornar vários registros (o próprio + subsetores), não só 1 — a tela de Setores
não precisa de nenhum tratamento especial de UI pra isso, a listagem existente já lida
com múltiplas linhas normalmente.

---

## 4. O que muda no frontend (Next.js) — sem ação do DBA

- `app/api/setores/route.ts` e `app/api/cargos/route.ts` já enviam `id_usuario_sessao`
  via `comEscopoUnidade` — nenhuma mudança de request necessária quando o backend
  implementar o item 2.
- **Já implementado, esperando o backend:** form de Cargo
  (`app/(protected)/cadastros/auxiliares/cargos/page.tsx`) ganhou o campo "Setor"
  (cascata Unidade → Setor, igual já existe em Funcionários), filtro por Setor na
  listagem, e coluna Setor na tabela. `GET/POST/PUT /cargos` já aceitam/enviam
  `id_setor`. A tela de Funcionários também foi ajustada: a lista de Cargo do formulário
  agora depende do Setor escolhido (não mais só da Unidade), já que cargo passou a
  pertencer a um setor específico.
- Nenhuma dessas mudanças de frontend depende de o backend já estar filtrando — hoje
  `GET /setores` continua irrestrito, então o select de Setor no form de Cargo mostra
  todos os setores da unidade normalmente. Quando o backend implementar o item 2, o
  filtro entra em vigor sem nenhuma mudança adicional no frontend (mesmo mecanismo
  transparente do escopo de unidade).

---

## 5. Rollout sugerido

1. DBA aplica a migration da coluna `core.cargos.id_setor` (item 1.1), nullable — não
   quebra nada, ninguém perde acesso.
2. Backend implementa o filtro/validação do item 2 (com a resolução recursiva da
   subárvore, item 3) nas quatro rotas, atrás do mesmo `id_usuario_sessao` que já chega
   hoje — como só ativa pra quem tem `id_funcionario` vinculado e
   `setor_irrestrito = false`, não muda nada pra quem já está configurado como
   irrestrito.
3. Rodar o backfill de `cargos.id_setor` (pode ser feito em paralelo ao passo 2, já que a
   coluna nula não bloqueia nada até o filtro entrar em vigor).
4. Frontend já está pronto (seção 4) — nenhuma ação adicional necessária aqui.
5. Validar em ambiente de teste com: um usuário vinculado a um funcionário de setor com
   subsetores (deve ver/editar o setor + subárvore, e os cargos de todos eles); um
   vinculado a um setor-folha (deve ver/editar só o próprio); e um
   `setor_irrestrito = true` (deve continuar vendo tudo).
