# Pendências de backend — retorno da auditoria (03/09)

**Objetivo:** este documento não é um contrato novo — é o retorno de uma auditoria que rodei
em 03/09 comparando os contratos já enviados com o comportamento real do banco/API hoje. Cada
item abaixo aponta pro contrato original (detalhe técnico completo, SQL de referência etc. já
estão lá, não repito aqui) e diz exatamente **o que falta** pra fechar. Ordenado por prioridade
sugerida.

> **Atualização (03/09, mesma data):** revisado contra o código-fonte da API no commit
> `fa27d00` (branch `develop`) — verificação por leitura de código, não reteste ao vivo contra
> API rodando. Itens 3 e 4 já saíram da lista de pendências (implementados nesse commit). Itens
> 1, 2, 5 e 6 seguem como estavam. Ver observação nova no item 1.

---

## 1. Bug — `GET /vendedores/:id/sugestoes` devolve 500 ⚠️ conferir referência

**Contrato original:** [`contrato-vinculo-vendedor-funcionario.md`](./contrato-vinculo-vendedor-funcionario.md), item 3.1.

**Status:** endpoint existe (responde, não é 404), mas quebrado — testado ao vivo em 03/09:

```
GET /vendedores/3f8e8d90-0838-43fb-8553-063511e49bfb/sugestoes
→ 500 { "error": "Erro interno" }
```

**Falta:** corrigir o erro interno. Formato de resposta esperado e SQL de referência estão no
contrato original.

**Nota (verificação por código, mesma data):** no commit `fa27d00`, `src/routes/vendedores.js`
não tem nenhuma rota `/sugestoes` — só `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`.
Não deu pra confirmar o bug nem uma correção por código, porque o endpoint referenciado não
existe neste arquivo/branch. Pode ter sido removido, estar em outro serviço, ou o nome da rota
mudou — vale confirmar a referência antes de seguir tratando como pendente.

---

## 2. Backfill de `vendedores.id_funcionario` não rodou

**Contrato original:** [`contrato-vinculo-vendedor-funcionario.md`](./contrato-vinculo-vendedor-funcionario.md), item 1.2.

**Status:** não rodou — testei 5 vendedores (`ABNER LUIS CARDOSO RODRIGUES`, `AGNALDO BARBOSA`,
`ANA CAROLINE VITAL` ×2, `ANTONIO PAIVA`) e todos estão com `id_funcionario: null`.

**Falta:** rodar o script de backfill do item 1.2 (não é destrutivo, só preenche onde está
`NULL`). Depende de confirmar `:id_cargo_vendedor`/`:id_setor_vendas` antes, conforme já
observado no contrato original.

**Nota (verificação por código, mesma data):** não dá pra confirmar isso por leitura de código —
é estado de dado, não de código. Confirmado só que o campo `id_funcionario` existe corretamente
mapeado em `src/models/vendedor.js` e é filtrável em `GET /vendedores?id_funcionario=`. Segue
pendente até reconferir direto no banco.

---

## 3. ~~Escopo por setor em `GET/POST/PUT/DELETE /funcionarios` não está ativo~~ ✅ RESOLVIDO

**Contrato original:** [`contrato-escopo-setor-rh.md`](./contrato-escopo-setor-rh.md), item 2.

**Status original (03/09, ao vivo):** banco pronto (`core.funcionarios.email` já existe e já é
gravado), API pendente. Confirmado ao vivo: usuário `Admin` (sem `id_funcionario` vinculado)
continua vendo os 162 funcionários normalmente em `GET /funcionarios` — pela regra do contrato,
deveria ver 0 (`id_funcionario = null` → lista vazia).

**Resolvido no commit `fa27d00`** (verificação por código, mesma data):
- `src/middlewares/escopoSetor.js` (arquivo novo) implementa a resolução
  `usuarios.id_funcionario → funcionarios.id_setor` (função `buscarSetores`).
- Aplicado em `src/app.js:1291`:
  `app.use("/funcionarios", resolverEscopoUnidade, resolverEscopoSetor, funcionariosRouter);`
- `src/routes/funcionarios.js` passa `escopoSetor: { coluna: "id_setor" }` pro
  `createCrudHandlers`, que aplica o filtro em `create`, `list`, `findOne`, `update` e `remove`
  (`src/utils/crudFactory.js`) — cobre GET (lista e por id), POST, PUT e DELETE, como o item
  2.1–2.3 do contrato original pedia.
- Confirma-se ainda que **não** foi montado em `/setores`, `/cargos` ou `/unidades`, preservando
  os dropdowns abertos como o contrato exigia.

**Falta agora:** só retestar ao vivo pra confirmar que o comportamento em produção bate com o
código (usuário sem vínculo → lista vazia; usuário vinculado → só o próprio setor).

---

## 4. ~~Override "setor irrestrito" não está ativo~~ ✅ RESOLVIDO

**Contrato original:** [`contrato-override-setor-usuario-rh.md`](./contrato-override-setor-usuario-rh.md), item 2.

**Status original (03/09, ao vivo):** banco pronto (`auth.usuarios.setor_irrestrito` já existe,
`false` por padrão), API pendente. Este item dependia do item 3 acima estar implementado
primeiro — é uma exceção sobre uma regra que não existia ainda.

**Resolvido no commit `fa27d00`** (verificação por código, mesma data) — aliás é o próprio commit
que trouxe o item 3, mensagem: *"add setor_irrestrito field for enhanced access control and
update related middleware logic"*:
- `src/models/usuario.js` define a coluna `setor_irrestrito`; `src/routes/usuarios.js` inclui em
  `CREATE_FIELDS` (editável via API).
- `src/middlewares/escopoSetor.js` busca `setor_irrestrito` junto com o usuário e checa **antes**
  de qualquer outra regra: `if (usuario.setor_irrestrito === true) return null;` (irrestrito) —
  exatamente a precedência "setor irrestrito ignora o vínculo" que o item 2.1–2.2 do contrato
  original pedia, mesmo pra usuário com `id_funcionario` vinculado.

**Falta agora:** retestar ao vivo com um usuário `setor_irrestrito=true` vinculado a um
funcionário, confirmando que ele vê todos os setores mesmo assim.

---

## 5. Bug — filtros de busca em `GET /parceiros` — segue pendente

**Contrato original:** [`pendencia-filtro-busca-parceiros.md`](./pendencia-filtro-busca-parceiros.md) (documento completo, com tabela de testes).

**Status:** ainda quebrado, retestado ao vivo em 03/09 (`nome_fantasia=IMPERIUNS`, nome exato de
parceiro real → `total: 0`).

**Falta:** aplicar `ILIKE '%<valor>%'` nos 4 parâmetros de texto, igual já funciona em
`GET /unidades`, `GET /setores`, `GET /cargos`, `GET /produtos`.

**Confirmado por código (mesma data, commit `fa27d00`):** `src/routes/parceiros.js:259-270`
ainda usa comparação exata (`where.nome_fantasia = query.nome_fantasia`,
`where.cpf_cnpj = query.cpf_cnpj`), não `Op.iLike`. Só 2 dos 4 filtros de texto do contrato estão
implementados (`nome_fantasia`, `cpf_cnpj`) — os outros 2 nem aparecem no filtro. Pra comparação,
`src/routes/vendedores.js:231-232` e `src/routes/funcionarios.js:269-275` já usam `Op.iLike`
corretamente — `parceiros.js` ficou pra trás e não recebeu o mesmo tratamento.

---

## 6. Cor por unidade — não iniciado

**Contrato original:** [`contrato-cor-unidade-dashboards.md`](./contrato-cor-unidade-dashboards.md).

**Status:** nada implementado ainda — nem a coluna `cor_unidade` (item 1.1) nem a quebra por
unidade em `vendas-mensal`/`faturamento-mensal` (item 3). Confirmado ao vivo: `GET /unidades`
não devolve `cor_unidade` no objeto.

**Falta:** todo o contrato original, do zero.

**Confirmado por código (mesma data, commit `fa27d00`):** `src/models/unidade.js` não define
`cor_unidade` em nenhum campo; `src/routes/unidades.js` (`FIELDS` e schema Swagger
`UnidadeCreate`) também não. Sem o campo no model, é impossível aparecer na resposta de
`GET /unidades`. Pendência confirmada como ainda em aberto, do zero.

---

## Rollout sugerido

1. ~~Item 1 (bug do 500)~~ — confirmar primeiro se a rota `/vendedores/:id/sugestoes` do
   contrato ainda existe/é deste serviço antes de agendar qualquer correção (ver nota no item 1).
   Item 5 (bug do filtro de parceiros) continua barato de corrigir — endpoint existente com
   problema pontual, não feature nova.
2. Item 2 (backfill) é uma query, roda em minutos assim que `:id_cargo_vendedor`/
   `:id_setor_vendas` forem confirmados.
3. ~~Itens 3 e 4~~ — **feitos** no commit `fa27d00`. Falta só retestar ao vivo com um usuário
   vinculado, um sem vínculo e um `setor_irrestrito=true` antes de considerar fechado de vez.
4. Item 6 é o maior — feature nova do zero, sem urgência definida ainda.

---

## Status consolidado (após revisão por código, 03/09)

| # | Item | Status |
|---|------|--------|
| 1 | 500 em `/vendedores/:id/sugestoes` | ⚠️ Referência a confirmar — rota não existe no código atual |
| 2 | Backfill `id_funcionario` | Pendente (dado, não código) |
| 3 | Escopo por setor em `/funcionarios` | ✅ Resolvido (commit `fa27d00`) — falta reteste ao vivo |
| 4 | Override `setor_irrestrito` | ✅ Resolvido (commit `fa27d00`) — falta reteste ao vivo |
| 5 | `ILIKE` em `GET /parceiros` | ❌ Pendente |
| 6 | `cor_unidade` em `/unidades` | ❌ Pendente, não iniciado |
