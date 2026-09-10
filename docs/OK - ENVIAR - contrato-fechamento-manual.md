# Pedido de nova tabela/rota — `fechamento_manual` (fechamento de Vendas/Faturamento por mês)

**Criado em:** 09/09/2026, a partir da nova tela "Fechamento" do av-hub.

**Não é bug — é uma tabela nova**, pro Nathan poder registrar manualmente o fechamento
oficial de Vendas e de Faturamento dos meses de janeiro/2026 a agosto/2026 (período em
que os totais automáticos dos dashboards têm divergências já documentadas — ver
`docs/ENVIAR - contrato-divergencia-faturamento-liquido.md`). A partir de setembro/2026 a
tela já usa os endpoints automáticos existentes (`fn_dashboard_mensal_vendas`/
`fn_dashboard_mensal_faturamento`), sem precisar de nada novo.

## 1. Tabela

Mesmo desenho de `core_vendas_faturamento.metas_mensais` (`src/models/meta_mensal.js`),
só trocando `meta` por `valor_total`:

```sql
CREATE TABLE core_vendas_faturamento.fechamento_manual (
  mes         SMALLINT NOT NULL,
  ano         SMALLINT NOT NULL,
  tipo        VARCHAR(12) NOT NULL DEFAULT 'venda', -- 'venda' ou 'faturamento'
  valor_total NUMERIC(15,2) NOT NULL,
  created_by  UUID,
  updated_by  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (mes, ano, tipo)
);
```

## 2. Model (Sequelize) — espelha `src/models/meta_mensal.js`

```js
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Fechamento oficial de Vendas/Faturamento por mês, digitado manualmente pelo
// admin pros meses em que o total automático não é confiável (jan-ago/2026).
// PK composta: (mes, ano, tipo).
const FechamentoManual = sequelize.define(
  "FechamentoManual",
  {
    mes: { type: DataTypes.SMALLINT, allowNull: false, primaryKey: true },
    ano: { type: DataTypes.SMALLINT, allowNull: false, primaryKey: true },
    tipo: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: "venda",
      primaryKey: true,
      comment: "'venda' ou 'faturamento'",
    },
    valor_total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true },
  },
  {
    tableName: "fechamento_manual",
    schema: "core_vendas_faturamento",
    timestamps: true,
    underscored: true,
  }
);

export default FechamentoManual;
```

## 3. Rota — espelha `src/routes/metas_mensais.js`

```js
import { Router } from "express";
import FechamentoManual from "../models/fechamento_manual.js";
import { handleSequelizeError } from "../utils/errorHandler.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";

const router = Router();

// POST / — upsert por (mes, ano, tipo)
router.post("/", async (req, res) => {
  try {
    const { mes, ano, valor_total, tipo = "venda", created_by, updated_by } = req.body;
    const [record, created] = await FechamentoManual.upsert(
      { mes, ano, valor_total, tipo, created_by, updated_by },
      { returning: true }
    );
    return res.status(created ? 201 : 200).json(record);
  } catch (err) {
    return handleSequelizeError(err, res, { uniqueMsg: "Dados de fechamento inválidos" });
  }
});

// GET / — filtros opcionais ano/mes/tipo
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.query.ano) where.ano = Number(req.query.ano);
    if (req.query.mes) where.mes = Number(req.query.mes);
    if (req.query.tipo) where.tipo = req.query.tipo;

    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await FechamentoManual.findAndCountAll({
      where,
      order: [["ano", "ASC"], ["mes", "ASC"], ["tipo", "ASC"]],
      limit,
      offset,
    });
    return res.json(paginatedResponse(rows, count, { page, limit, key: "fechamento_manual" }));
  } catch (err) {
    return handleSequelizeError(err, res);
  }
});

// DELETE /:ano/:mes/:tipo
router.delete("/:ano/:mes/:tipo", async (req, res) => {
  try {
    const count = await FechamentoManual.destroy({
      where: { ano: Number(req.params.ano), mes: Number(req.params.mes), tipo: req.params.tipo },
    });
    if (!count) return res.status(404).json({ detail: "Fechamento não encontrado" });
    return res.json({ message: "Fechamento removido" });
  } catch (err) {
    return handleSequelizeError(err, res);
  }
});

export default router;
```

Registrar em `app.js` como `/fechamento_manual`, mesmo padrão de `/metas_mensais`.

## 4. O que o frontend já espera (já construído, só falta a tabela existir)

- `GET /api/fechamento-manual?ano=2026&tipo=venda` — lista o ano inteiro de um tipo.
- `POST /api/fechamento-manual` — `{ mes, ano, tipo, valor_total }`, upsert.
- `DELETE /api/fechamento-manual/{ano}/{mes}/{tipo}` — remove um lançamento.

Sem essa tabela, a tela "Fechamento" mostra os meses de jan-ago/2026 como "ainda não
preenchido" (não é erro, só não tem dado pra ler) e o botão de salvar retorna erro até a
rota existir.
