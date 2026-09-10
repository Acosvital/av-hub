# Pendência — filtro por nome não funciona em GET /funcionarios

**Sintoma:** na tela Funcionários (RH), digitar um nome no filtro "Nome" não restringe a
lista — continua mostrando todos os funcionários, independente do texto digitado.

**Onde já foi verificado (frontend, Next.js) — descartado como causa:**
- [app/(protected)/rh/funcionarios/page.tsx](../app/(protected)/rh/funcionarios/page.tsx) —
  o valor digitado passa por `useDebounce` e é enviado como `nome_completo` em toda
  chamada a `getFuncionarios`, do mesmo jeito que os outros filtros que funcionam
  (`codigo_empresa`, `id_setor`, `id_cargo`).
- [services/rh/funcionarios.ts](../services/rh/funcionarios.ts) — `nome_completo` é
  incluído na query string enviada para `/api/funcionarios`.
- [app/api/funcionarios/route.ts](../app/api/funcionarios/route.ts) — `nome_completo`
  está na lista de parâmetros repassados para
  `GET ${API_URL}/funcionarios?nome_completo=...` no backend externo.

O padrão é idêntico ao usado em outras telas com filtro por nome que funcionam
corretamente (ex: Produtos, Setores, Cargos).

**Causa provável:** a rota `GET /funcionarios` no backend externo (fora deste
repositório) recebe o parâmetro `nome_completo` mas não o aplica na consulta —
provavelmente porque só os filtros mais antigos da rota (`codigo_empresa`, `id_setor`,
`id_cargo`) foram implementados, e `nome_completo` ficou pendente.

**O que precisa ser feito no backend:** aplicar um filtro `ILIKE '%<nome_completo>%'`
(ou equivalente, busca parcial e case-insensitive) sobre o campo de nome do funcionário
quando o parâmetro `nome_completo` vier na query string de `GET /funcionarios` — mesmo
comportamento que os filtros por nome de `GET /setores`, `GET /cargos` e `GET /produtos`
já têm.
