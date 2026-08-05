# Padrão de layout dos dashboards

> Para o histórico detalhado de cada mudança feita nesta padronização
> (o quê e por quê), ver [CHANGELOG.md](./CHANGELOG.md).

Todo dashboard usa uma grade fixa de **12 colunas x 6 linhas**
([DashboardGrid.module.css](../DashboardGrid/DashboardGrid.module.css)),
com a altura total da tela dividida igualmente entre as 6 linhas. Cada
widget declara quantas colunas/linhas ocupa via `DashboardWidget`
(`cols` de 1 a 12, `rows` de 1 a 6 — ver
[DashboardWidget.tsx](../DashboardWidget/DashboardWidget.tsx)).

**Regra de ouro:** a soma das linhas de cada coluna vertical do grid
deve sempre fechar em 6. Se sobrar espaço (ex.: uma coluna some 5 de
6), o grid deixa uma faixa vazia mostrando o fundo — foi esse o bug
que gerou as sobreposições/gaps corrigidos no dashboard de Vendas. Ao
adicionar ou redimensionar um widget, sempre confira se as colunas
continuam somando 6 linhas.

## Padrão "hero + ranking" (Vendas, e candidatos a Faturamento)

Dashboards cuja métrica central é um indicador único (ex.: % da meta)
acompanhado de um ranking de vendedores devem usar o componente
[`DashboardHeroLayout`](./DashboardHeroLayout.tsx) em vez de montar o
`DashboardGrid`/`DashboardWidget` na mão. Ele já define 4 zonas fixas
e uma opcional:

| Zona             | Colunas | Linhas             | Conteúdo típico                          |
| ---------------- | ------- | ------------------ | ----------------------------------------- |
| `hero`           | 1-6     | 1-3                | Gauge / indicador principal               |
| `ranking`        | 7-12    | 1-6                | Lista de ranking (altura total da tela)   |
| `secondaryStats` | 1-3     | 4-6 (ou 4-5 c/ `tertiary`) | Estatísticas rápidas (hoje/ontem)  |
| `secondaryPace`  | 4-6     | 4-6 (ou 4-5 c/ `tertiary`) | Card de ritmo de meta / progresso  |
| `tertiary` (opcional) | 1-6 | 6                  | Faixa extra abaixo das duas anteriores (ex.: "Vendas por Tipo") |

Quando `tertiary` é informado, `secondaryStats`/`secondaryPace` encolhem
de 3 para 2 linhas cada, para abrir espaço mantendo a soma em 6.

`secondaryStats` e `secondaryPace` ficam lado a lado, ambos com 3
linhas, para fechar exatamente as 6 linhas junto com o `hero` (3) —
por isso as duas zonas secundárias devem ter a MESMA altura entre si.
Se o conteúdo de uma delas for mais curto (ex.: "Venda Diária" e
"Volume de Pedidos" no dashboard de Vendas), agrupe os itens curtos em
um único card empilhado (ver `.stackedSections` em
[dash-vendas/styles.module.css](../../../app/(protected)/dashboards/dash-vendas/styles.module.css))
em vez de deixar uma caixa isolada com espaço vazio.

### Componentes de conteúdo padrão

Os widgets que compõem os slots do `DashboardHeroLayout` devem usar
estes componentes em vez de recriar CSS local:

- **[`SectionCard`](../SectionCard/SectionCard.tsx)** — wrapper com
  fundo, padding e cantos arredondados padrão (substitui os antigos
  `.defaultCard` que cada página duplicava com pequenas variações).
- **[`CardHeader`](../CardHeader/CardHeader.tsx)** — cabeçalho de
  card (ícone/dot + título + slot opcional à direita para pill/contador).
  Usado hoje pelo `GoalPaceCard` e pelos títulos "Venda Diária"/"Volume
  de Pedidos" do dash-vendas.
- **[`DailyStatCard`](../DailyStatCard/DailyStatCard.tsx)** — par
  "hoje/ontem" usado nos widgets de estatística diária (venda diária,
  volume de pedidos, faturamento diário, notas fiscais). Reaproveitado
  por Vendas e Faturamento.
- **`.sectionLabel`** ([styles/dashboard-tokens.css](../../../styles/dashboard-tokens.css))
  — classe global (fora de CSS Modules, aplicar como `className="sectionLabel"`)
  para o `text-transform: uppercase` + tamanho de fonte dos rótulos de
  seção, usada pelo `CardHeader` e pelo `RevenueGauge`.

### Exemplo de uso

```tsx
<DashboardHeroLayout
  hero={<RevenueGauge ... />}
  ranking={<div className={styles.card}>...</div>}
  secondaryStats={
    <SectionCard>
      <CardHeader title="Venda Diária" icon={<span className={dot} />} />
      <DailyStatCard todayValue={...} yesterdayValue={...} />
    </SectionCard>
  }
  secondaryPace={<GoalPaceCard ... />}
/>
```

Cada slot recebe o conteúdo já pronto (inclusive o próprio tratamento
de loading de cada widget) — o componente só cuida do posicionamento
no grid.

## Sistema de cor dos cards (3 camadas)

Ver [CHANGELOG.md #13-14](./CHANGELOG.md) para o histórico completo.
Resumo do padrão atual, usado em Vendas e Faturamento:

| Camada | Token | Uso |
| --- | --- | --- |
| Fundo da página | `--navy-950` | `.dashboardContainer` |
| Corpo do card | `--navy-850` | `SectionCard`, `.card` (Ranking), `.defaultCard`, gauge |
| Faixa interna | `--navy-925` | `DailyStatCard`, `.metaCards`, `.tipoVendaRow`/`.billings`/`.situationGroup`, `.fixedRank`/`.defaultRank` |
| Borda | `--navy-915` | `border: 1px solid` em todo card (inclusive o gauge) |

Ao adicionar um card novo, siga essa mesma escala em vez de usar
`var(--card-bg)`/`var(--border)` (tokens antigos, theme-aware, que não
se aplicam mais a estes dois dashboards).

## Débito técnico conhecido

- **Faturamento não usa `SectionCard`/`CardHeader`** fora do
  `DailyStatCard`/`GoalPaceCard`/`Faturamento Diário`/`Volume de Notas
  Fiscais` — os widgets "Tipo de faturamento" e "Situação" ainda usam
  `.defaultCard`/`.billings`/`.situationGroup` locais (já no mesmo
  esquema de cor da tabela acima, só não migrados para os componentes
  compartilhados). Migrar fica para quando Faturamento adotar um
  `DashboardHeroLayout` estendido (ver seção abaixo).

## Dashboards que não seguem esse padrão

- **Faturamento** (`dash-faturamento`) tem widgets extras (logo,
  histórico de faturamento, tipo de faturamento, situação de pedidos)
  que não cabem nas 4 zonas acima. Ainda usa `DashboardGrid`/
  `DashboardWidget` diretamente. Uma extensão natural seria um
  `DashboardHeroLayout` com um slot extra (`secondaryChart` ou
  similar) — ainda não migrado.
- **Comissões** (`dash-comissoes`) segue um padrão totalmente
  diferente (KPIs + tabela + gráfico de rosca, sem gauge nem
  ranking de cards), então não é candidato a este layout.
