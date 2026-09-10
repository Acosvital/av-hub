# Contrato — "Nossa História" e telas de boas-vindas

**Data:** 04/09/2026, 09:03 (horário de Brasília — data/hora do arquivo local, documento
ainda não commitado).

**Objetivo:** este documento não pede uma mudança de backend — é o estudo/documentação de três
endpoints que **já existem e já funcionam** em produção (`api.acosvital.com.br`), mas não
estavam documentados em nenhum lugar deste repositório. Serve de referência pra quem for
consumir esse conteúdo (av-hub, Organograma, ou qualquer app novo) sem precisar redescobrir o
formato na mão.

**Como foi levantado:** a seção 1 (`/historia`) e a seção 2 (`/welcome-settings`,
`/welcome-presets`) são baseadas no **spec OpenAPI oficial** (`api-1 (12).json`, exportado por
Nathan) — não é mais inferência, é o contrato real documentado pela própria API. Os exemplos de
dado (JSON de resposta) foram conferidos ao vivo, só leitura, com a `x-api-key` do
`.env.local` — nenhuma escrita foi testada em nenhum dos três (ver seção 5, "O que não foi
testado").

---

## 1. `/historia` — página "Nossa História"

Conteúdo institucional (texto + galeria + linha do tempo) — **singleton global**, não por
unidade: testado com e sem `?codigo_empresa=<uuid de uma filial>` e a resposta veio idêntica
nos dois casos.

### 1.1 `GET /historia`

Sem parâmetros. `x-api-key` obrigatório (mesmo padrão de toda a API — sem ele, `401`).

```ts
interface HistoriaResponse {
  titulo: string;
  texto: string;
  video_url: string | null;
  updated_at: string | null;   // ISO 8601
  imagens: {
    id: string;                // uuid
    url: string;
    legenda: string | null;
  }[];                          // ordenadas por `ordem` (campo interno, não exposto)
  timeline: {
    id: string;                 // uuid
    ano: number;
    titulo: string;
    descricao: string | null;
    imagem_url: string | null;
  }[];                          // ordenada por `ano`
}
```

**Exemplo real (resumido, timeline truncada para 2 de 8 itens):**

```json
{
  "titulo": "O começo de tudo!",
  "texto": "A Aços Vital iniciou sua trajetória em 2015, em Mogi das Cruzes (SP)...",
  "video_url": null,
  "updated_at": "2026-08-17T19:26:05.600Z",
  "imagens": [
    { "id": "46d6c8cc-f4ce-46b3-af90-fb649e4dfba4", "url": "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1920&q=80", "legenda": "" }
  ],
  "timeline": [
    {
      "id": "4f83feb1-e772-452b-b387-6b28e9feda2d",
      "ano": 2015,
      "titulo": "O nascimento da Aços Vital",
      "descricao": "Joanes Oliveira deixa seu emprego para cuidar de Amanda Vital...",
      "imagem_url": "https://s3.acosvital.com.br/organograma-prd-historia/MOGI/historia_primeiro.webp"
    },
    {
      "id": "0011e065-860e-48a7-be28-fe2475d59161",
      "ano": 2026,
      "titulo": "Aços Vital e HRM",
      "descricao": "A HRM Caldeiraria inicia uma nova fase em sua trajetória...",
      "imagem_url": "https://s3.acosvital.com.br/organograma-prd-historia/uploads/e2718c02-5e6a-4e71-9d8f-76e09ee6234b.webp"
    }
  ]
}
```

### 1.2 `PUT /historia` — atualização parcial, com regra especial pra arrays

```ts
interface HistoriaInput {
  // Todos os campos opcionais — mande ao menos um. Campo AUSENTE fica como está;
  // campo PRESENTE substitui.
  titulo?: string;        // max 200
  texto?: string;         // aceita "" — coluna tem DEFAULT ''
  video_url?: string | null;
  imagens?: HistoriaImagemInput[];   // lista COMPLETA — ver regra abaixo
  timeline?: HistoriaTimelineInput[]; // lista COMPLETA — ver regra abaixo
}

interface HistoriaImagemInput {
  id?: string;       // uuid — informar = atualiza o registro; omitir = cria novo
  url: string;        // obrigatório
  legenda?: string;   // max 255
}

interface HistoriaTimelineInput {
  id?: string;         // uuid — informar = atualiza; omitir = cria
  ano: number;          // obrigatório, 1001..2999
  titulo: string;       // obrigatório, max 200
  descricao?: string;
  imagem_url?: string;
}
```

**Regra importante pra quem for montar uma tela de edição:** em `imagens`/`timeline`, a lista
enviada é **completa**, não incremental — item com `id` atualiza o registro existente, item sem
`id` cria um novo, e qualquer registro que exista hoje mas **não apareça** no array enviado é
**apagado**. Pra esvaziar a galeria ou a timeline de propósito, manda `[]` explicitamente (nunca
omite o campo se a intenção é essa). Toda a operação roda numa transação — se um item falhar a
validação, nada é alterado.

**Erros:**
- `400` — payload vazio, tipo errado, `url`/`ano`/`titulo` ausente num item, `ano` fora de
  1001..2999, ou `id` que não existe. A mensagem aponta o índice do item com problema.
- `500` — falha de banco (ex.: permissão insuficiente do usuário da aplicação); a causa real só
  vai pro log do backend, não pra resposta.

### 1.3 Bucket de imagens: `organograma-prd-historia`

Mesmo padrão dos outros dois buckets já usados pelo av-hub (`organograma-prd-empresa`,
`organograma-prd-pessoas`, ver `lib/s3/fotos.ts`) — um terceiro bucket dedicado a essa seção.
Duas convenções de path convivendo nos dados de hoje:
- `MOGI/<nome>.webp` — fotos mais antigas, nomeadas manualmente.
- `uploads/<uuid>.webp` — fotos mais recentes, mesmo padrão de upload já usado pelo av-hub.

`imagem_url`/`url` já vêm como **URL absoluta pronta pra uso** (não uma key opaca como
`foto_url` de funcionários/unidades no av-hub) — não precisa de assinatura/proxy pra exibir.
Sugere bucket público, ou URLs pré-assinadas de validade longa — vale confirmar antes de
reaproveitar esse padrão em tela nova.

---

## 2. Telas de boas-vindas (`/welcome-settings`, `/welcome-presets`)

Feature de white-label: um app de login pode exibir uma tela de boas-vindas com nome/cor/logo
de um cliente específico (ex.: "Bem-vindo, Construtora Horizonte"), configurável por preset.
Hoje **nenhum preset foi criado** (`GET /welcome-presets` devolve `[]` em produção) — a feature
existe no backend, mas está com a tela genérica ativa, sem nenhum cliente cadastrado ainda.

### 2.1 `GET /welcome-settings` — configuração ativa (singleton)

```ts
interface WelcomeSettingsResponse {
  enabled: boolean;              // false = a tela de boas-vindas não intercepta o login
  active_preset_id: string | null; // null = exibe "Bem-vindo" genérico, sem nome/logo de cliente
  updated_at: string;             // ISO 8601
}
```

**Confirmado ao vivo (produção, hoje):**
```json
{ "enabled": true, "active_preset_id": null, "updated_at": "2026-08-27T19:42:42.625Z" }
```

Particularidade documentada no spec: é um registro único — se a linha não existir (migração
aplicada pela metade), a API **cria com os defaults da tabela em vez de responder 404**, pra
nunca deixar a tela de login sem configuração.

### 2.2 `PUT /welcome-settings` — atualização parcial

```ts
interface WelcomeSettingsInput {
  enabled?: boolean;
  active_preset_id?: string | null; // null desativa o preset em exibição (volta ao genérico) SEM desligar a tela — pra desligar de vez, manda enabled: false
}
```

`422` se `enabled` não for booleano, ou `active_preset_id` apontar pra um preset inexistente.

### 2.3 `GET /welcome-presets` — lista todos os presets

Sem paginação (lista pequena, poucas dezenas esperadas) — devolve **array puro**, não o
envelope `{ total, page, ... }` do resto da API (o spec é explícito: "porque é o que o app
espera"). Ordenado por `nome_cliente`.

```ts
interface WelcomePresetResponse {
  id: string;           // uuid
  nome_cliente: string;
  logo_url: string | null;
  cor_inicio: string | null;   // "#RRGGBB"
  cor_fim: string | null;      // "#RRGGBB" — cor_inicio/cor_fim juntos formam um gradiente
  created_at: string;
  updated_at: string;
}
```

Confirmado ao vivo: `[]` (nenhum preset cadastrado ainda).

### 2.4 `POST /welcome-presets` — cria um preset

```ts
interface WelcomePresetCreate {
  nome_cliente: string;         // obrigatório, max 100
  logo_url?: string | null;
  cor_inicio?: string | null;   // padrão "#RRGGBB"
  cor_fim?: string | null;      // padrão "#RRGGBB"
}
```

`201` com o preset criado (`WelcomePresetResponse`). `400` se `nome_cliente` ausente/vazio/>100
chars. `422` se `cor_inicio`/`cor_fim` não baterem `^#[0-9A-Fa-f]{6}$`.

### 2.5 `GET/PUT/DELETE /welcome-presets/{id}`

- `GET` — `200` com o preset, `404` se não existir.
- `PUT` — parcial: campo omitido não muda; campo enviado como `null` (ou `""`) **limpa** o
  valor (é assim que se remove o logo ou o gradiente de um preset salvo). `nome_cliente` não
  pode ser limpo (`NOT NULL` na tabela) — omitir mantém, enviar string vazia dá `400`.
- `DELETE` — remove o preset. Se ele estava ativo em `welcome_settings`, `active_preset_id` é
  zerado automaticamente (a tela volta ao "Bem-vindo" genérico, `enabled` não muda) — a
  resposta inclui `preset_desativado: boolean` indicando se isso aconteceu:
  ```ts
  { ok: boolean; message: string; preset_desativado: boolean }
  ```

---

## 3. Banco de dados — esquema inferido (não confirmado contra o Postgres)

O OpenAPI documenta o contrato de API, não o schema de banco — este repositório não tem acesso
direto ao Postgres, então o SQL abaixo é uma leitura de fora pra dentro (formato de resposta +
regras de validação do spec), não um schema conferido linha a linha. Convenção seguida: mesmo
estilo das tabelas já documentadas em outros contratos deste projeto (`core_organograma.*`,
uuid como PK).

```sql
-- "Nossa História" — singleton, sem codigo_empresa (história é do grupo, não da unidade)
CREATE TABLE IF NOT EXISTS core_organograma.historia (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text NOT NULL,
  texto       text NOT NULL DEFAULT '',
  video_url   text,
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core_organograma.historia_imagens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  historia_id  uuid NOT NULL REFERENCES core_organograma.historia (id) ON DELETE CASCADE,
  url          text NOT NULL,
  legenda      varchar(255),
  ordem        integer NOT NULL DEFAULT 0  -- define a ordem de exibição (ver 1.2, "a ordem do array define a ordem de exibição")
);

CREATE TABLE IF NOT EXISTS core_organograma.historia_timeline (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  historia_id  uuid NOT NULL REFERENCES core_organograma.historia (id) ON DELETE CASCADE,
  ano          integer NOT NULL CHECK (ano BETWEEN 1001 AND 2999),
  titulo       varchar(200) NOT NULL,
  descricao    text,
  imagem_url   text
);
-- timeline não parece ter coluna de ordem própria — GET devolve ordenada por ano (ORDER BY ano)

-- Boas-vindas — settings é singleton (auto-cria com defaults se a linha faltar, ver 2.1)
CREATE TABLE IF NOT EXISTS core_organograma.welcome_settings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled            boolean NOT NULL DEFAULT true,
  active_preset_id   uuid REFERENCES core_organograma.welcome_presets (id) ON DELETE SET NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core_organograma.welcome_presets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente  varchar(100) NOT NULL,
  logo_url      text,
  cor_inicio    varchar(7) CHECK (cor_inicio IS NULL OR cor_inicio ~ '^#[0-9A-Fa-f]{6}$'),
  cor_fim       varchar(7) CHECK (cor_fim IS NULL OR cor_fim ~ '^#[0-9A-Fa-f]{6}$'),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

`ON DELETE SET NULL` em `welcome_settings.active_preset_id` é a minha melhor hipótese pra
explicar o comportamento documentado no `DELETE /welcome-presets/{id}` (zera a referência
automaticamente) — pode também ser feito via trigger/lógica de aplicação em vez de constraint
de banco; o spec não diferencia os dois.

---

## 4. Uso no frontend — Organograma já consome os três, só leitura

Não é o av-hub — é o **Organograma** (`organograma_acosvital`) quem já usa os três endpoints
hoje, todos em modo leitura (nenhum `PUT`/`POST`/`DELETE` usado em lugar nenhum do código dele):

- **`/historia`** — página `src/app/historia/page.tsx` (item "Nossa História" no menu lateral,
  `Sidebar.tsx:117`), com proxy próprio (`src/app/api/historia/route.ts` →
  `getHistoriaContent()` em `src/lib/data/historia.ts`). Isso resolve a dúvida de "quem é o
  app" que o spec da API menciona — é este.
- **`/welcome-settings` + `/welcome-presets`** — página `src/app/bem-vindo/page.tsx`, mostrada
  **depois do login** pra dar boas-vindas a visitas especiais (ex.: cliente visitando a
  empresa): se `enabled=false` redireciona pra home; se `active_preset_id` aponta pra um preset,
  monta um gradiente (`cor_inicio`/`cor_fim`) de fundo e mostra o logo do cliente ao lado do
  logo da Aços Vital, com o texto "Bem-vindo, `{nome_cliente}`." Sem preset ativo, mostra
  "Bem-vindo." genérico — bate exatamente com o que o spec da API documenta.

**A lacuna real:** não existe, em nenhum dos dois sistemas, uma tela pra **editar** esse
conteúdo — nem pra atualizar a história/timeline, nem pra cadastrar/ativar um preset de
boas-vindas. Hoje isso só dá pra fazer chamando a API direto (Insomnia/Postman). Se a ideia é
ter um painel de administração pra isso, esse contrato já cobre o formato de escrita necessário
(seções 1.2, 2.2, 2.4, 2.5) — falta só decidir onde essa tela mora (Organograma, que já é quem
consome os dados, ou av-hub) e construir.

---

## 5. O que não foi testado, de propósito

- **Nenhuma escrita** — `PUT /historia`, `PUT /welcome-settings`, `POST/PUT/DELETE
  /welcome-presets` — não tentei nenhuma. `/historia` é conteúdo institucional real, possivelmente
  visível fora da empresa; `/welcome-settings` controla o que a tela de login de algum app mostra
  pra gente de verdade agora (`enabled: true` em produção) — mexer nisso por engano afeta login
  de gente real. `/welcome-presets` seria o mais seguro de testar (lista vazia, criar um preset de
  teste e apagar não afeta ninguém), mas não fiz por não ter sido pedido.
- **Não precisou mais investigar qual app consome** — confirmado na seção 4: é o Organograma.
