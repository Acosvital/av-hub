# Contrato — Tela inicial por Perfil

**Criado em:** 05/09/2026 14:21

**Objetivo:** eliminar o hardcode de "se o perfil se chama X, redireciona pra rota Y" que hoje
decide a tela inicial do usuário logado. A regra passa a ser dado (configurável por um admin
na tela de Cadastros → Perfis), não string de nome de perfil espalhada no frontend.

**Situação atual (frontend já implementado, aguardando o backend):**
[app/(protected)/page.tsx](../app/(protected)/page.tsx) já lê `session.user.telaInicialId`
(resolvido no login/sync em
[app/api/auth/[...nextauth]/route.ts](<../app/api/auth/[...nextauth]/route.ts>)) e, se vier
preenchido, redireciona pra lá. Como o campo ainda não existe no backend, ele sempre chega
`null` e o app cai num fallback temporário por nome de perfil (`PERFIS_REDIRECIONAM_RH_FALLBACK`
/ `PERFIS_REDIRECIONAM_VENDEDOR_FALLBACK`, ambos marcados no código com `FALLBACK TEMPORÁRIO`).
**Assim que o backend implementar o item 1 abaixo e os perfis relevantes forem configurados
pela tela de Perfis, esse bloco de fallback pode ser apagado.**

---

## 1. Banco de dados

Coluna nova em `auth.perfis`, FK opcional pra `auth.telas` (ajuste o schema abaixo se o nome
real for diferente do usado nos outros contratos deste repo — `auth.perfis`/`auth.telas` é o
padrão inferido de `docs/contrato-escopo-unidades-rh.md`):

```sql
ALTER TABLE auth.perfis
  ADD COLUMN tela_inicial_id uuid NULL
  REFERENCES auth.telas(id) ON DELETE SET NULL;
```

- **Nullable de propósito** — nem todo perfil precisa de uma tela inicial configurada (ex.:
  perfis administrativos que não usam essa navegação).
- **`ON DELETE SET NULL`** — se a tela referenciada for excluída no cadastro de Telas, o perfil
  não fica com uma FK quebrada; só perde a configuração e volta a cair no fallback do frontend
  até alguém reconfigurar.
- Sem UNIQUE — mais de um perfil pode apontar pra mesma tela inicial (ex.: dois perfis de RH
  diferentes ambos indo pra `solicitacoes-de-vagas`).
- Sem backfill necessário — todo perfil existente começa com `tela_inicial_id = NULL` e continua
  funcionando exatamente como hoje (fallback por nome), até um admin configurar pela UI.

---

## 2. API (api-acos-vital)

### 2.1 Leitura

`GET /perfis` e `GET /perfis/:id` passam a incluir `tela_inicial_id` no JSON de cada perfil:

```jsonc
{
  "id": "uuid",
  "nome": "Vendedor",
  "descricao": "...",
  "tela_inicial_id": "uuid-da-tela" // ou null
}
```

### 2.2 Escrita

`POST /perfis` e `PUT /perfis/:id` passam a aceitar `tela_inicial_id` no corpo (`uuid | null`).
`null` explícito precisa **limpar** o vínculo (não ser ignorado/mantido).

### 2.3 Contrato de erro

```
409 { "detail": "tela_inicial_id não existe ou está com deleted_at preenchido" }
```

### 2.4 Sem mudança nenhuma em `/usuarios_perfis`

O vínculo usuário↔perfil continua exatamente igual — a tela inicial é uma propriedade do
**perfil**, não do vínculo.

### 2.5 Sem endpoint novo

O frontend já busca perfis via `GET /perfis` (usado em
[app/api/auth/[...nextauth]/route.ts](<../app/api/auth/[...nextauth]/route.ts>) pra resolver a
sessão, e em `app/api/perfis` pra tela de cadastro) — só precisa do campo a mais na resposta que
já existe.

---

## 3. O que já está pronto no frontend (sem ação nenhuma quando o item 1/2 for entregue)

- **Resolução no login:** `fetchInfoPerfisDoUsuario` (em
  [app/api/auth/[...nextauth]/route.ts](<../app/api/auth/[...nextauth]/route.ts>)) já busca
  `tela_inicial_id` de cada perfil vinculado ao usuário e guarda em
  `session.user.telaInicialId`. Critério de empate quando o usuário tem mais de um perfil:
  primeiro vínculo (na ordem em que `/usuarios_perfis` devolve) cujo perfil tiver
  `tela_inicial_id` preenchido. **Não existe prioridade explícita ainda** — se isso virar um
  problema real (usuário com 2 perfis conflitantes), a resposta certa é o backend expor uma
  ordem/prioridade em `/usuarios_perfis` ou `/perfis`, não uma regra inventada no frontend.
- **Resolução da rota:** `tela_inicial_id` é o `id` de uma tela (o mesmo `id` usado em
  `auth.permissoes`/no menu, ex. `'meu-dashboard'`, `'solicitacoes-de-vagas'`) — **não** é um
  path pronto. A rota completa é resolvida andando a árvore do próprio menu do usuário via
  [utils/menuTree.ts](../utils/menuTree.ts) (`encontrarPathDoItem`), pela mesma regra de
  composição `pai/filho` que o sidebar já usa pra montar links. Ou seja: nenhum mapa
  id→rota adicional pra manter — a árvore do menu já é essa fonte única.
- **Cadastro de Perfis:** [app/(protected)/cadastros/acessos/perfis/page.tsx](<../app/(protected)/cadastros/acessos/perfis/page.tsx>)
  já tem o campo "Tela inicial" (select, populado com as telas-folha existentes via
  `GET /telas`). Salva/edita `tela_inicial_id` normalmente assim que o backend aceitar o campo.

---

## 4. Rollout sugerido

1. Backend aplica a migration do item 1 (não quebra nada — coluna nova, nullable).
2. Backend implementa a leitura/escrita do item 2.
3. Um admin configura "Tela inicial" pelos perfis relevantes (Vendedor → Meu Dashboard,
   RH - Joanes/RH - Analistas → Solicitações de Vagas) pela tela de Cadastros → Perfis — sem
   precisar de deploy do frontend.
4. Depois de confirmar que os perfis relevantes estão configurados e redirecionando certo,
   remove o bloco `FALLBACK TEMPORÁRIO` em
   [app/(protected)/page.tsx](<../app/(protected)/page.tsx>) — ele só existe pra não quebrar
   ninguém enquanto o item 1-3 não tiver saído.
