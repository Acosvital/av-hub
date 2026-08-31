# Contrato — Override "todos os setores" por usuário (RH)

**Objetivo:** permitir que um usuário restrito por setor (ver
[`contrato-escopo-setor-rh.md`](./contrato-escopo-setor-rh.md)) tenha essa restrição
removida individualmente, passando a ver **todos os setores** na tela de Funcionários —
sem alterar o `id_setor` do funcionário ao qual ele está vinculado. É um controle de
acesso do usuário (auth), não um dado de RH.

Este documento complementa [`contrato-escopo-setor-rh.md`](./contrato-escopo-setor-rh.md)
e reaproveita o mesmo mecanismo (`id_usuario_sessao`) já usado nos dois contratos
anteriores — não introduz parâmetro novo, só uma condição extra na resolução do escopo.

---

## 1. Banco de dados

### 1.1 Nova coluna: `auth.usuarios.setor_irrestrito`

```sql
ALTER TABLE auth.usuarios ADD COLUMN setor_irrestrito boolean NOT NULL DEFAULT false;
```

Por que uma coluna booleana em vez de uma tabela N:N (como foi feito para unidade em
`usuarios_unidades`): a necessidade aqui é binária — "só o meu setor" ou "todos os
setores" — não "meu setor + mais dois específicos". Uma tabela de vínculos seria
complexidade sem benefício para esse caso; se essa granularidade for necessária no
futuro, aí sim cabe revisitar para o padrão N:N.

`DEFAULT false` torna o rollout retrocompatível: ninguém ganha acesso extra até que
alguém marque a flag explicitamente para um usuário específico.

---

## 2. API (api-acos-vital)

### 2.1 Regra — precedência sobre o contrato de setor existente

Na resolução de escopo de `GET/POST/PUT/DELETE /funcionarios` descrita em
`contrato-escopo-setor-rh.md` (item 2.1), adicionar um passo **antes** dos demais:

1. Resolver `setor_irrestrito` de `auth.usuarios` para o `id_usuario_sessao` recebido.
2. **Se `setor_irrestrito = true`** → não aplicar nenhum filtro de setor. O usuário vê
   todos os setores, **mesmo que não tenha `id_funcionario` vinculado** (isso substitui
   inteiramente a regra "sem funcionário vinculado = lista vazia" do contrato anterior —
   a flag tem prioridade sobre o vínculo).
3. **Se `setor_irrestrito = false`** (padrão) → segue exatamente a regra já documentada
   em `contrato-escopo-setor-rh.md` (2.1–2.3): sem `id_funcionario` = vazio; com
   `id_funcionario` = filtra pelo `id_setor` dele.

O escopo de unidade (`usuarios_unidades`) não é afetado por essa flag — ela controla
apenas o filtro de setor.

### 2.2 Mutações (`POST`, `PUT/DELETE /funcionarios/:id`)

Mesma precedência: se `setor_irrestrito = true`, pular a validação de `id_setor` descrita
no item 2.3 de `contrato-escopo-setor-rh.md` — o usuário pode criar/editar/excluir
funcionários de qualquer setor.

### 2.3 Gravar a flag — reaproveita o contrato de usuários existente

Não é necessário um endpoint novo. `setor_irrestrito` entra como mais um campo no corpo
de `PUT /usuarios/:id` e `POST /usuarios`, do mesmo jeito que `id_funcionario` já é
enviado hoje:

```
PUT /usuarios/:id
body: { ..., "id_funcionario": "<uuid> | null", "setor_irrestrito": true | false }
```

---

## 3. O que muda no frontend (Next.js) — sem ação do DBA

- `app/api/usuarios/[id]/route.ts` (`PUT`) e `app/api/usuarios/route.ts` (`POST`) já
  repassam o corpo da requisição sem transformá-lo — nenhuma mudança de código
  necessária aí, `setor_irrestrito` passa por eles automaticamente assim que o campo
  existir no form.
- Tela de Usuários (`app/(protected)/cadastros/acessos/usuarios/page.tsx`): adicionar um
  toggle/checkbox "Acesso a todos os setores" logo abaixo do Autocomplete "Funcionário
  vinculado" (linhas 424–441). Quando marcado, o setor herdado do funcionário deixa de
  valer para esse usuário — o campo é só leitura (o setor em si continua vindo do
  cadastro do funcionário; aqui só se decide se a restrição vale ou não).

---

## 4. Rollout sugerido

1. DBA aplica a migration da coluna `setor_irrestrito` (item 1.1) — `DEFAULT false` não
   muda comportamento de ninguém.
2. Backend implementa a precedência do item 2.1/2.2, atrás da mesma flag — como ela
   nasce `false` para todo mundo, ainda não muda nada em produção.
3. Eu adiciono o toggle na tela de Usuários e ligo ao campo já passante do `PUT/POST
   /usuarios`.
4. Só então alguém marca `setor_irrestrito = true` para os usuários que devem enxergar
   todos os setores — a partir daí a exceção passa a valer só para eles.
