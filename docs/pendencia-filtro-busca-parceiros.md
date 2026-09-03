# Pendência — filtros de busca não funcionam em GET /parceiros

**Sintoma:** na tela Parceiros (Cadastros > Auxiliares), digitar qualquer coisa no campo de
busca nunca retorna resultado (`total: 0`), mesmo digitando o nome exato de um parceiro que
existe. Não é uma questão de maiúscula/minúscula — o filtro simplesmente não bate nunca.

**Onde já foi verificado (frontend, Next.js) — descartado como causa:**
- [app/(protected)/cadastros/auxiliares/parceiros/page.tsx](../app/(protected)/cadastros/auxiliares/parceiros/page.tsx) —
  o campo de busca envia `nome_fantasia` (ou `cpf_cnpj`, se o termo parecer um CNPJ) via
  `getParceiros`, com debounce de 500ms, mesmo padrão de outras telas com filtro funcionando.
- [services/cadastros/auxiliares/parceiros.ts](../services/cadastros/auxiliares/parceiros.ts) —
  `nome_fantasia`/`razao_social`/`cpf_cnpj`/`cidade`/`estado` são incluídos corretamente na
  query string enviada para `/api/parceiros`.
- [app/api/parceiros/route.ts](../app/api/parceiros/route.ts) — todos os 5 parâmetros de
  filtro estão na lista repassada para `GET ${API_URL}/parceiros?...` no backend externo.

Testado direto contra `/api/parceiros` (bypassando a UI) pra isolar o problema — resultados
com a base tendo **10.065 parceiros** no total:

| Chamada | `total` esperado | `total` real |
|---|---|---|
| `?nome_fantasia=a` | milhares (letra comum) | **0** |
| `?nome_fantasia=IMPERIUNS` (substring de um parceiro real) | ≥ 1 | **0** |
| `?nome_fantasia='IMPERIUNS MATERIAIS DE CONSTRUCAO'` (nome **exato** de um parceiro real) | 1 | **0** |
| `?razao_social=SILVA` | algumas centenas | **10065** (= sem filtro nenhum) |
| `?cidade=SAO PAULO` | milhares | **10065** (= sem filtro nenhum) |
| `?cpf_cnpj=11` | 0 ou mais (substring de CNPJ) | **0** |

**Causa provável — dois bugs diferentes na mesma rota:**
1. `nome_fantasia` e `cpf_cnpj`: o filtro **é aplicado**, mas nunca bate com nada — nem com
   o nome exato de um parceiro que existe. Sugere comparação contra a coluna errada, ou um
   `WHERE` malformado que sempre avalia falso.
2. `razao_social` e `cidade`: o filtro é **ignorado por completo** — devolve a base inteira,
   como se o parâmetro não tivesse sido enviado. Mesmo padrão do bug já documentado em
   [pendencia-filtro-nome-funcionarios.md](./pendencia-filtro-nome-funcionarios.md), mas numa
   rota diferente.

**O que precisa ser feito no backend:** revisar `GET /parceiros` nos 4 parâmetros de texto —
aplicar `ILIKE '%<valor>%'` (busca parcial, case-insensitive) igual já funciona em
`GET /unidades` (que usa esse mesmo nome de parâmetro, `nome_fantasia`, corretamente) e em
`GET /setores`, `GET /cargos`, `GET /produtos`.
