# Contrato — busca funcional em todas as telas com barra de pesquisa

**Data do levantamento:** 04/09/2026, 13:19 (horário de Brasília — data/hora do arquivo
local, documento ainda não commitado), testado ao vivo contra a API de produção
(`https://api.acosvital.com.br/`) com a mesma metodologia dos contratos anteriores
(chamada direta à API, comparando `total` com filtro vs. sem filtro).

**Objetivo:** todas as telas do HUB usam o mesmo componente de busca
([SearchFilterBar.tsx](../components/Ui/SearchFilterBar/SearchFilterBar.tsx)), que é
"burro" — só repassa o texto digitado pra página, que decide o parâmetro de API e
chama o backend. Ou seja, **o frontend já está pronto em todas as telas**: debounce,
parâmetro certo, endpoint certo. O que falta é 100% backend. Este documento consolida:
(1) bugs novos encontrados nesta varredura, (2) bugs já documentados e ainda abertos,
retestados hoje, e (3) confirmação do que já funciona, pra não gerar retrabalho.

Por instrução própria do projeto: nenhuma dessas buscas deve ganhar um paliativo no
frontend (filtrar em memória escondendo o problema) — quem tem paginação de verdade no
backend precisa de filtro de verdade no backend.

---

## Resumo — status por tela

| Tela | Endpoint | Campo(s) de busca | Status |
|---|---|---|---|
| Vendedores (`vendas/vendedores`) | `GET /vendedores` | `nome` | ✅ OK (ILIKE, testado hoje com termo inexistente) |
| Vendedores (`vendas/vendedores`) | `GET /vendedores` | `codigo_vendedor_omie` | ❌ **Novo bug** — filtro ignorado |
| Pedidos de Venda | `GET /pedidos_vendas` | `numero_pedido` | ⚠️ **Novo bug** — só match exato, sem substring |
| Pedidos de Venda | `GET /pedidos_vendas` | `codigo_cliente` | ⚠️ **Novo bug** — só match exato, sem substring |
| Notas Fiscais de Saída | `GET /nota_fiscal_saida` | `numero_nf` | ⚠️ **Novo bug** — só match exato (com zeros à esquerda) |
| Funcionários (RH) | `GET /funcionarios` | `nome_completo` | ❌ Já documentado, **ainda aberto** (retestado hoje) |
| Parceiros | `GET /parceiros` | `nome_fantasia`, `cpf_cnpj`, `razao_social`, `cidade` | ❌ Já documentado, **ainda aberto** (retestado hoje) |
| Unidades | `GET /unidades` | `nome_fantasia`, `cnpj` | ❌ **Novo bug** — filtro ignorado |
| Setores | `GET /setores` | `nome` | ✅ OK |
| Produtos | `GET /produtos` | `codigo_produto`, `descricao` | ✅ OK |
| Cargos | `GET /cargos` | `nome` | ❌ **Novo bug** — filtro ignorado (`codigo_empresa` no mesmo endpoint funciona) |
| Usuários | `GET /usuarios` | `username`, `email` | ✅ OK (testado hoje) |
| Telas | `GET /telas` | `nome` | ✅ OK (testado hoje) |
| Perfis | `GET /perfis` | `nome` | ✅ OK (testado hoje) |
| Permissões | — (client-side) | perfil | ✅ OK — lista de perfis é pequena e carregada inteira, filtro em memória é intencional |
| Metas Mensais | `GET /metas-mensais` | `ano` | ✅ OK por natureza (filtro numérico exato, não é busca textual) |
| Solicitações de Vagas | `GET /vagas` | `cargo`, `solicitante`, `setor` | ⚪ Não testável hoje — tabela vazia em produção (`total: 0`). Frontend/rota corretos; validar quando houver dados |
| Orçamento (Vínculos / Sem Cadastro / Categorias) | — (client-side) | categoria/fornecedor | ✅ OK — dataset carregado inteiro de uma vez (sem paginação de servidor), filtro em memória é o desenho correto aqui |

---

## 1. Bug novo — `GET /vendedores?codigo_vendedor_omie=` é ignorado

**Onde:** [app/(protected)/vendas/vendedores/page.tsx](../app/(protected)/vendas/vendedores/page.tsx) —
a busca decide entre `codigo_vendedor_omie` (se o termo for só dígitos) e `nome` (caso
contrário). `nome` funciona perfeitamente; `codigo_vendedor_omie` não filtra nada.

**Evidência (04/09, base com 105 vendedores):**

| Chamada | `total` esperado | `total` real |
|---|---|---|
| `?nome=ABNER` | 1 | **1** ✅ |
| `?nome=abner` (case) | 1 | **1** ✅ |
| `?nome=CARDOSO` (substring do meio) | 1 | **1** ✅ |
| `?codigo_vendedor_omie=9877796676` (código exato de um vendedor real) | 1 | **105** ❌ (= sem filtro) |
| `?codigo_vendedor_omie=987` (substring) | 1 ou mais | **105** ❌ (= sem filtro) |

**Causa provável:** mesmo padrão dos bugs já documentados em `parceiros` — o parâmetro
chega na rota mas não é usado no `WHERE`.

**O que precisa ser feito:** aplicar `ILIKE '%<valor>%'` (ou `Op.iLike` no Sequelize,
como já funciona em `src/routes/vendedores.js` pro campo `nome`) também no campo do
código do vendedor. Como é um código, pode fazer sentido usar prefixo
(`ILIKE '<valor>%'`) em vez de substring livre — mas hoje **não filtra nada**, então
qualquer um dos dois já resolve.

---

## 2. Bug novo — `GET /pedidos_vendas` só aceita match exato (`numero_pedido` e `codigo_cliente`)

**Onde:** [app/(protected)/vendas/pedidos-de-venda/page.tsx](../app/(protected)/vendas/pedidos-de-venda/page.tsx) —
a busca decide entre `numero_pedido` (dígitos) e `codigo_cliente` (texto), mesmo padrão
das outras telas. O problema aqui é diferente do bug "filtro ignorado": os dois campos
**filtram**, mas exigem o valor **inteiro e exato** — não acham nada por substring.

**Evidência (04/09, base com 8.095 pedidos):**

| Chamada | Situação | `total` |
|---|---|---|
| `?numero_pedido=62` (valor exato de um pedido real) | match exato | **2** ✅ |
| `?numero_pedido=6` (substring do "62" acima) | deveria achar o "62" também | **1** (só achou outro pedido cujo número é literalmente "6") ❌ |
| `?codigo_cliente=11214443721` (código exato de um cliente) | match exato | **14** ✅ |
| `?codigo_cliente=112144` (substring do código acima) | deveria achar os mesmos 14 | **0** ❌ |

**Impacto real:** como a barra de busca da tela promete "Buscar por número do pedido ou
cliente...", o usuário natural mente digita um pedaço do número ou do código — e como
hoje só bate com o valor 100% exato, a busca praticamente nunca funciona na prática (o
usuário teria que já saber o número/código completo, caso em que nem precisaria buscar).

**Observação à parte (não é bug, é limitação de dado):** `codigo_cliente` é o código
numérico do cliente na Omie, não o nome — a API de pedidos não expõe nome do cliente
nenhum. Então mesmo depois de corrigir o match parcial, buscar por **nome** do cliente
continua impossível nessa tela; só por número de pedido ou código do cliente. Vale
avaliar com o backend se dá pra fazer join com `parceiros` (por `codigo_cliente` ↔
`codigo_parceiro_omie`) pra expor `nome_cliente` e permitir busca por nome de verdade —
mas isso é melhoria nova, não faz parte do bug de hoje.

**O que precisa ser feito (mínimo):** trocar o `WHERE` de igualdade exata por
`ILIKE '%<valor>%'` em `numero_pedido` e `codigo_cliente`, mesmo padrão já usado em
`vendedores.nome`.

---

## 3. Bug novo — `GET /nota_fiscal_saida?numero_nf=` exige zeros à esquerda

**Onde:** [app/(protected)/vendas/notas-fiscais-saida/page.tsx](../app/(protected)/vendas/notas-fiscais-saida/page.tsx) —
único campo de busca da tela.

**Evidência (04/09, base com 4.359 NFs; NF real armazenada como `"00051705"`):**

| Chamada | `total` esperado | `total` real |
|---|---|---|
| `?numero_nf=00051705` (valor exato armazenado, com zeros à esquerda) | 1 | **1** ✅ |
| `?numero_nf=51705` (forma natural de digitar, sem zeros à esquerda) | 1 | **0** ❌ |
| `?numero_nf=5170` (substring) | 1 | **0** ❌ |

**Impacto real:** nenhum usuário digita zeros à esquerda de cabeça — na prática a busca
por número de NF não funciona pra praticamente nenhum caso de uso real.

**O que precisa ser feito:** aplicar `ILIKE '%<valor>%'` sobre `numero_nf` (resolve o
caso de substring) **e**, idealmente, normalizar o valor buscado preenchendo com zeros à
esquerda até o tamanho da coluna antes de comparar, ou comparar convertendo ambos os
lados pra numérico — pra cobrir tanto "51705" quanto "005170" quanto substrings.

---

## 4. Bug novo — `GET /cargos?nome=` é ignorado

**Onde:** [app/(protected)/cadastros/auxiliares/cargos/page.tsx](../app/(protected)/cadastros/auxiliares/cargos/page.tsx) —
único jeito de buscar cargo por texto (os outros filtros da tela são dropdown de
unidade/setor/status, todos via `Select`, não texto livre).

**Evidência (04/09, base com 118 cargos):**

| Chamada | `total` esperado | `total` real |
|---|---|---|
| `?nome=Diretoria` (nome exato de um cargo real) | 1 | **118** ❌ (= sem filtro) |
| `?nome=diretoria` (lowercase) | 1 | **118** ❌ |
| `?nome=Geral` (substring de "Gerente Geral") | ≥ 2 | **118** ❌ |
| `?nome=ger` (substring curto) | ≥ 2 | **118** ❌ |
| `?codigo_empresa=759979bd-...` (outro filtro da mesma rota, pra comparar) | — | **108** ✅ (filtra normalmente) |

O último teste é o que isola o problema: `codigo_empresa` filtra certinho na mesma
rota — só `nome` está sendo ignorado.

**O que precisa ser feito:** aplicar `ILIKE '%<valor>%'` sobre `nome` em
`GET /cargos`, mesmo padrão que já funciona em `nome` de `/vendedores`, `/usuarios`,
`/telas` e `/perfis`.

---

## 5. Bug novo — `GET /unidades` (`nome_fantasia` e `cnpj`) é ignorado

**Onde:** [app/(protected)/cadastros/auxiliares/unidades/page.tsx](../app/(protected)/cadastros/auxiliares/unidades/page.tsx).
Esse é o caso mais enganoso da varredura: a base de produção só tem **3 unidades**
cadastradas hoje, então qualquer teste com um termo que bate em pelo menos uma delas
"parece" funcionar (retorna resultado, sem erro). Só um termo garantidamente inexistente
expõe que o filtro está sendo ignorado por completo.

**Evidência (04/09, base com 3 unidades: "Aços Vital", "Hrm Caldeiraria Industrial
LTDA", "Aços Uberaba"):**

| Chamada | `total` esperado | `total` real |
|---|---|---|
| `?nome_fantasia=Uberaba` (nome exato de uma unidade real) | 1 | **3** (parece certo, mas é a base inteira) |
| `?nome_fantasia=aco` (substring comum às 2 primeiras) | 2 | **3** (idem) |
| `?nome_fantasia=ZZZNAOEXISTE999` (termo que não existe em nenhuma) | 0 | **3** ❌ — prova que o filtro não é aplicado |
| `?cnpj=62.270.345` (CNPJ exato de uma unidade real) | 1 | **3** (parece certo, mas é a base inteira) |
| `?cnpj=00000000000000` (CNPJ que não existe) | 0 | **3** ❌ |

**O que precisa ser feito:** aplicar `ILIKE '%<valor>%'` sobre `nome_fantasia` e `cnpj`
em `GET /unidades`, mesmo padrão de `/vendedores`, `/usuarios`, `/telas` e `/perfis`.
Como a tela também busca por `cnpj` sem pontuação (o campo aceita os dois formatos hoje
no input), vale normalizar removendo pontuação de ambos os lados na comparação, não só
aplicar `ILIKE` puro — senão `?cnpj=62270345` (sem pontuação) continua sem achar o
registro salvo como `"62.270.345/0001-12"`.

---

## 6. Já documentado, retestado hoje — ainda aberto

Estes dois já têm contrato próprio com todo o detalhe técnico; aqui é só a confirmação
de que continuam quebrados na mesma forma, testado ao vivo em 04/09:

- **`GET /funcionarios?nome_completo=`** — retestei com o nome exato de um funcionário
  real (`"Abner Luiz Cardoso Rodrigues"`) → `total: 189` (= base inteira, sem filtro).
  Ver [pendencia-filtro-nome-funcionarios.md](./pendencia-filtro-nome-funcionarios.md).
- **`GET /parceiros?nome_fantasia=`** — retestei com o nome exato de um parceiro real →
  `total: 10065` (= base inteira, sem filtro). Ver
  [pendencia-filtro-busca-parceiros.md](./pendencia-filtro-busca-parceiros.md) (inclui
  os outros 3 campos quebrados: `cpf_cnpj`, `razao_social`, `cidade`).

---

## 7. Confirmado funcionando (referência de padrão correto)

Todos os itens abaixo foram retestados ao vivo hoje **com duas evidências**: um termo
que deveria achar resultado (achou) e um termo garantidamente inexistente
(`ZZZNAOEXISTE999`, retornou `total: 0`) — esse segundo teste é o que realmente prova
que o filtro é aplicado, e não só "parece funcionar" por o resultado ter poucos
registros (foi exatamente esse ponto cego que mascarou o bug de `unidades`, item 5):

- `GET /vendedores?nome=` — ILIKE, case-insensitive, substring ✅
- `GET /usuarios?username=` e `?email=` — ILIKE, case-insensitive, substring ✅
- `GET /telas?nome=` — ILIKE, case-insensitive, substring ✅
- `GET /perfis?nome=` — ILIKE, case-insensitive, substring ✅
- `GET /setores?nome=` — ILIKE, case-insensitive, substring ✅
- `GET /produtos?descricao=` e `?codigo_produto=` — ILIKE, case-insensitive, substring ✅

**Atenção:** `GET /cargos` e `GET /unidades` **não** entram nessa lista — apesar de
terem sido dados como "funcionando" em auditorias anteriores (provavelmente
verificados só por leitura de código, sem reteste ao vivo, ou testados só com termos
que coincidentemente bateram em algo), o teste de hoje com termo inexistente mostra
que os dois estão quebrados (itens 4 e 5). Os filtros de dropdown da tela de Cargos
(`codigo_empresa`, `id_setor`) continuam OK — só o campo de texto livre está quebrado.

---

## Rollout sugerido

1. **Item 1 (vendedores/código)**, **item 3 (NF/número)**, **item 4 (cargos/nome)** e
   **item 5 (unidades)** — todos o mesmo tipo de correção (`ILIKE`), mesmo padrão que
   já existe em 6+ rotas da mesma API. Prioridade alta, esforço baixo por item. `cargos`
   e `unidades` são os mais urgentes: são telas de cadastro básico (não consultas
   secundárias), usadas com frequência pra achar um registro específico antes de editar.
2. **Item 2 (pedidos de venda)** — troca de igualdade por `ILIKE` nos dois campos,
   mesmo esforço dos itens acima. A melhoria de expor nome do cliente (join com
   parceiros) é separada e pode ficar pra depois.
3. **Item 6 (funcionários e parceiros)** — já são contratos antigos represados; incluídos
   aqui só pra manter a lista de pendências de busca em um único lugar atualizado.
4. **Vagas** — sem dado em produção pra testar; conferir quando a tela tiver uso real.

## Status consolidado

| # | Item | Status |
|---|------|--------|
| 1 | `codigo_vendedor_omie` ignorado em `/vendedores` | ❌ Novo — pendente |
| 2 | Match exato em `numero_pedido`/`codigo_cliente` de `/pedidos_vendas` | ❌ Novo — pendente |
| 3 | Match exato (com zeros) em `numero_nf` de `/nota_fiscal_saida` | ❌ Novo — pendente |
| 4 | `nome` ignorado em `/cargos` | ❌ Novo — pendente |
| 5 | `nome_fantasia`/`cnpj` ignorados em `/unidades` | ❌ Novo — pendente |
| 6 | `nome_completo` em `/funcionarios` | ❌ Pendente (já documentado) |
| 7 | `nome_fantasia`/`cpf_cnpj`/`razao_social`/`cidade` em `/parceiros` | ❌ Pendente (já documentado) |
| 8 | Vendedores (nome), Usuários, Telas, Perfis, Setores, Produtos | ✅ OK (confirmado com teste negativo) |
| 9 | Vagas (`cargo`/`solicitante`/`setor`) | ⚪ Sem dado pra testar |
