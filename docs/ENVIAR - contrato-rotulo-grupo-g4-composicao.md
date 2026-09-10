# Contrato — texto do grupo G4 na composição do resumo (planilha crua)

## Pedido

Nas telas **Notas da Equipe** e **Pedidos da Equipe** (Portal do Gerente), a seção
"Composição do Faturamento/Vendas do mês (Bruto → Deduções → Líquido)" mostra uma
linha por grupo de dedução. O texto de cada linha (`rotulo`) vem pronto do backend.

Hoje, a linha do grupo **G4** vem assim:

```
(−) Aços Vital Chile (operações no exterior)
```

Pedido: mudar só o **texto**, sem alterar nada na lógica de agregação/valor —
continua sendo a mesma linha, mesmo grupo G4, mesma quantidade e valor somados,
só o rótulo passa a ser:

```
(−) Aços Vital Chile (operações no exterior) e Aços Vital
```

A linha do grupo **G5** ("(−) Aços Vital Vendedor (operações internas)") **não
muda** — continua como está, como linha separada.

## Onde confirmar

Endpoints afetados (confirmado ao vivo, mesmo texto nos dois):

- `GET /vendas_planilha_resumo` (usado por **Pedidos da Equipe**)
- `GET /faturamento_planilha_resumo` (usado por **Notas da Equipe**)

Exemplo da resposta atual (`grupo: "G4"`):

```json
{
  "ordem": 6,
  "secao": "2 · DEDUÇÕES",
  "tipo": "deducao",
  "rotulo": "(−) Aços Vital Chile (operações no exterior)",
  "grupo": "G4",
  "valor": "0.00",
  "qtd_nfs": "0",
  "pct_total": "0.0"
}
```

## Escopo

- Só o campo `rotulo` da linha `grupo: "G4"` muda, nos dois endpoints acima.
- Nenhum outro campo (valor, qtd_nfs/qtd_pedidos, pct_total, ordem, grupo) muda.
- A linha G5 não é afetada.
- Frontend não precisa de nenhuma mudança — só exibe `linha.rotulo` como vier.
