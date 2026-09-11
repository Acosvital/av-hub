# Processo de Comissionamento — Simulador (protótipo)

**Onde vive no HUB:** menu lateral → Operações → **Experimental → Simulador de Comissão**
(rota `/experimental/simulador-comissao`).

**Código-fonte:** `app/(protected)/experimental/simulador-comissao/`
- `page.tsx` — a tela
- `_lib/calculo.ts` — toda a lógica de cálculo (funções puras, sem estado)
- `_data/referencia.ts` — tabelas de referência (percentuais, faixas, condições de pagamento)
- `types.ts` — tipos TypeScript do pedido/itens/resultado

**Status:** protótipo local, 100% front-end, sem gravar nada em banco. Serve pra validar a
lógica de negócio com a equipe antes de virar contrato pro DBA (ver
[`ENVIAR - contrato-fornecedores-por-produto.md`](../ENVIAR%20-%20contrato-fornecedores-por-produto.md)
pra uma lacuna de dado já identificada).

---

## 1. De onde isso veio

Hoje o vendedor tira um pedido no Omie e depois vai numa planilha Excel manual
(`CUSTO_<pedido>_desb.xlsx`, aba "SIMULAÇÃO PREÇO PEDIDOS") calcular o preço de venda e
descobrir a comissão. Essa planilha devolve uma **letra** (A/B/C/D) que hoje precisa ser
traduzida "de cabeça" pra um percentual de comissão — a fórmula que deveria fazer essa
tradução automaticamente dentro da planilha está quebrada (multiplica a letra, que é texto,
como se fosse número — dá erro `#VALUE!`).

Este módulo reimplementa a lógica da planilha na tela, já corrigindo esse bug e outro problema
de cálculo (ver seção 6), como uma tela de verdade que o vendedor usaria pra gerenciar o pedido
dele e já sair com o valor de comissão certo.

## 2. O que o vendedor preenche

### Cabeçalho do pedido
| Campo | O que é |
|---|---|
| Cliente / Nº do Pedido | identificação, não entra no cálculo |
| Estado Destino | UF de entrega — define a alíquota de ICMS na venda |
| Isento de imposto? | zera todos os impostos do cálculo quando marcado |
| Cond. de Pagamento | define um encargo % (juros embutido) somado ao preço |
| Frete na venda / Valor ST do pedido / Imposto Retido-DIFAL | valores em R$ somados direto ao valor final do pedido |

### Itens do pedido (um card por item)
| Campo | O que é |
|---|---|
| Buscar no catálogo de produtos | autocomplete que preenche descrição, UM, fornecedor e preço de compra a partir da última cotação registrada |
| Descrição | editável mesmo depois de puxar do catálogo |
| Fornecedor | abre um modal de busca por nome/razão social/CNPJ em todo o catálogo de fornecedores |
| Qtd. / UM / Preço Unit. Compra | dados de custo do item |
| Origem da Compra | São Paulo / São Paulo - Base de ICMS Reduzida / Demais Estados / São Paulo - Importação / Demais Estados - Importação / Optante Simples — define o ICMS a recuperar na compra |
| % IPI / Valor ST | custos adicionais de compra do item |
| Preço Unit. Venda | **opcional** — se deixado em branco, o sistema usa o preço sugerido calculado pelo markup (ver seção 3) |

Clicando em **"Calcular Comissão"**, o sistema roda a cadeia de cálculo abaixo pra todos os
itens de uma vez.

---

## 3. Cadeia de cálculo, passo a passo

### 3.1 Custo líquido de cada item

```
compraTotal   = quantidade × preçoUnitCompra
icmsRecuperar = temST ? 0 : compraTotal × %ICMS_da_origem_da_compra
valorIPI      = compraTotal × %IPI
totalLíquido  = compraTotal − icmsRecuperar + valorIPI + valorST
```

`%ICMS_da_origem_da_compra` vem de uma tabela fixa por origem (São Paulo 18%, São Paulo - Base
Reduzida 13,3%, Demais Estados 12%, São Paulo/Demais Estados - Importação 18%/4%, Optante
Simples 0%). Se o item tem Substituição Tributária (`valorST > 0`), não há ICMS a recuperar.

### 3.2 Multiplicador de markup (preço sugerido)

O sistema calcula um multiplicador que, aplicado sobre o custo líquido, já embute margem
desejada + despesas fixas da empresa + impostos sobre a venda + uma provisão de comissão:

```
soma% = margemDesejada(10%) + despesasFixas(11,45%) + comissãoBase(2%)
        + ICMS_do_destino + PIS_líquido + COFINS_líquido + IRPJ(1,2%) + CSL(1,08%) + Adicional_IRPJ(0,76%)

multiplicador = ROUNDUP(1 / (1 − soma%), 2)
```

- `despesasFixas` é a soma de 9 categorias de custo operacional da empresa (Pessoal,
  Administrativas, Logística, Financeiras, Produção, Marketing, Contribuições, Serviços de
  Terceiros, Sedes) — hoje congelada num snapshot Fev–Mai/23 (ver seção 5).
- `PIS_líquido` = 0,65% − (0,65% × ICMS_do_destino); `COFINS_líquido` = 3% − (3% × ICMS_do_destino)
  — o ICMS é abatido da base de cálculo desses dois tributos.
- Se o pedido é isento de imposto, essa parte toda (ICMS/PIS/COFINS/IRPJ/CSL/Adicional) é
  removida da soma.

```
preçoUnitSugerido = ROUNDUP((totalLíquido / quantidade) × multiplicador, 2) × (1 + encargoCondPagamento)
```

O **preço de venda efetivo** do item é o que o vendedor digitou em "Preço Unit. Venda" — se
deixar em branco, usa o `preçoUnitSugerido` acima.

### 3.3 Margem e status de cada item (indicador visual, não decide a comissão)

```
margemItem = (valorVendaTotal − totalLíquido) / valorVendaTotal
```
- `margemItem ≤ 0` → **PREJUÍZO** (vermelho)
- `0 < margemItem < 10%` → **NEGOCIAR** (amarelo)
- `margemItem ≥ 10%` → **PEDIDO OK** (verde)

Isso é só um sinal por item pro vendedor perceber item fraco no meio do pedido — quem decide a
comissão é a margem do **pedido inteiro**, seção 4.

### 3.4 Totais do pedido

```
valorCompraTotal   = soma do totalLíquido de todos os itens
valorVendaTotal     = soma do valorVendaTotal de todos os itens
                       + freteNaVenda + valorSTdoPedido + impostoRetidoDIFAL
icmsEfetivoMédio     = soma do ICMS efetivo de cada item / valorVendaTotal
                       (média ponderada pelo valor de venda de cada item)
```

O "ICMS efetivo" de cada item depende de uma combinação de origem da compra × UF de destino ×
se tem ST — mesma tabela de regras da planilha original (importação sempre recolhe
18%/4% dependendo do destino ser SP ou não; item com ST não paga ICMS de novo se o destino é
SP; etc).

---

## 4. Margem líquida real → Letra → Comissão

Esta é a conta que decide a comissão — separada da margem "de markup" usada só pra sugerir
preço (seção 3.2):

```
despesasOperacionaisReais = valorVendaTotal × despesasFixas(11,45%)
impostosReais             = valorVendaTotal × (ICMS_médio + PIS + COFINS + IRPJ + CSL + Adicional_IRPJ)

margemLíquidaReal = (valorVendaTotal − despesasOperacionaisReais − impostosReais − valorCompraTotal)
                    / valorVendaTotal
```

Ou seja: receita do pedido, menos a fatia de despesa fixa da empresa que esse pedido carrega,
menos os impostos que vão ser recolhidos sobre ele, menos o que foi pago pra comprar a
mercadoria — tudo dividido pela receita. É margem líquida de verdade (pós-tributos e
pós-overhead), não markup bruto.

### Faixas de comissão (regra definida em 10/09/2026)

| Margem líquida real | Letra | % Comissão |
|---|---|---|
| ≤ 0% | D | **0%** — pedido em **PREJUÍZO**, comissão zerada mesmo caindo na faixa D |
| 0% – 8,99% | D | 0,5% |
| 9% – 11,99% | C | 0,7% |
| 12% – 14,99% | B | 1,3% |
| ≥ 15% | A | 2% |

```
comissãoReais = valorVendaTotal × %Comissão_da_faixa
```

**A regra do prejuízo é a principal diferença em relação à planilha original**: lá, o status
"Prejuízo" (`margem ≤ 0`) e a classificação em letra eram calculados em fórmulas separadas, sem
se conectar — uma margem negativa ainda caía na faixa "D" e (se a fórmula quebrada estivesse
funcionando) teria gerado 0,5% de comissão mesmo em prejuízo. Aqui, prejuízo sempre zera a
comissão, não importa a letra.

---

## 5. Premissas e simplificações (protótipo, não é contrato fechado)

- **Percentuais de despesa fixa** (11,45% no total, distribuído nas 9 categorias) são um
  snapshot Fev–Mai/23 da planilha original — servem de referência pro protótipo, precisam ser
  revisados/atualizados com dado real antes de qualquer produção.
- **Frete na compra**: só o modo "rateio por %" é suportado — o modo "informar valor exato do
  frete" da planilha original não foi implementado.
- **ICMS efetivo do pedido**: aqui é a média ponderada de todos os itens; a planilha original
  usava só o ICMS do primeiro item da lista pra decidir o ICMS do pedido inteiro (bug herdado,
  não repetido aqui — ver seção 6).
- **Comissão-base de 2%** embutida no multiplicador de markup (seção 3.2) é uma provisão pra
  precificação, não a comissão final — a comissão final vem da tabela da seção 4 e pode ser
  maior ou menor que essa provisão.
- **Fornecedor por produto**: a busca de fornecedor não filtra por "quem atende esse produto"
  porque essa relação não existe nos dados hoje — ver
  [`ENVIAR - contrato-fornecedores-por-produto.md`](../ENVIAR%20-%20contrato-fornecedores-por-produto.md).

## 6. Bugs da planilha original corrigidos aqui

1. **Comissão calculada como `valor × letra`** — a planilha multiplicava o valor do pedido
   diretamente pela letra (texto "A"/"B"/"C"/"D"), gerando erro `#VALUE!`. Aqui a letra vira
   percentual primeiro, através da tabela da seção 4.
2. **Linha "CMV" misturando R$ com %** — uma célula da planilha (`Cálculo de Mark-up!L22`)
   pegava um valor em R$ de outra aba e usava como se fosse percentual num multiplicador,
   inflando o preço sugerido sem necessidade. Removida do cálculo do multiplicador aqui.
3. **Prejuízo não zerava comissão automaticamente** — ver seção 4.
4. **ICMS do pedido baseado só no primeiro item** — a planilha original decidia o ICMS do
   pedido inteiro olhando só a origem do primeiro item da lista, mesmo com itens de origens
   diferentes no mesmo pedido. Aqui é uma média ponderada de todos os itens (seção 3.4).

## 7. Próximos passos

1. Equipe testa o simulador com pedidos reais e compara os números com a planilha atual.
2. Ajustar os percentuais de despesa fixa (seção 5) com dado atualizado, se necessário.
3. Validado o cálculo, transformar em contrato pro DBA (ver
   [`OK - contrato-vinculo-vendedor-funcionario.md`](../OK%20-%20contrato-vinculo-vendedor-funcionario.md)
   como exemplo de formato) pra sair do protótipo local e virar cálculo de verdade no backend,
   por pedido, junto com o resto do fluxo Omie → HUB.
