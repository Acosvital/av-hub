'use client';

import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import Gauge from '@/components/Charts/Gauge/Gauge';
import Button from '@/components/Ui/Button/Button';
import MesSeletor from '@/components/Ui/MesSeletor/MesSeletor';
import ClienteDetalhesModalEquipe, {
  ClienteDetalhesEquipeProps,
} from '@/components/PortalGerente/ClienteDetalhesModalEquipe/ClienteDetalhesModalEquipe';
import useDashboardDate from '@/hooks/useDashboardDate';
import { getDashboardEquipe, DashboardEquipeResponse } from '@/services/portalGerente/dashboardEquipe';
import { getClientesInativosEquipe } from '@/services/portalGerente/clientesInativosEquipe';
import { ClienteInativoEmpresaProps } from '@/lib/api/dashboardEquipeDomain';
import { TipoContrato } from '@/lib/api/meuDashboardDomain';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import TIPO_CONTRATO_COLORS from '@/utils/tipoContratoColors';
import { trilhaMeta, corPorMetaBatida } from '@/utils/metaColor';
import { calcularSlaPedido } from '@/utils/slaPedido';
// Mesmo visual do Meu Dashboard (Portal do Vendedor) — reaproveita o CSS
// module direto em vez de duplicar a folha de estilo inteira.
import styles from '@/app/(protected)/meu-dashboard/styles.module.css';

const TIPOS: TipoContrato[] = ['SPOT', 'CONTRATO', 'SEM CLASSIFICAÇÃO'];

function variacaoPerc(atual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

const LIMITE_INICIAL_TOP_CLIENTES = 5;
const LIMITE_INICIAL_INATIVOS = 8;
const LIMITE_INICIAL_TOP_PRODUTOS = 5;

export default function DashboardEquipe() {
  const [loading, setLoading] = useState(true);
  const [resposta, setResposta] = useState<DashboardEquipeResponse | null>(null);
  const [clientesInativos, setClientesInativos] = useState<ClienteInativoEmpresaProps[]>([]);
  const [verTodosTopClientes, setVerTodosTopClientes] = useState(false);
  const [verTodosTopProdutos, setVerTodosTopProdutos] = useState(false);
  const [verTodosInativos, setVerTodosInativos] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteDetalhesEquipeProps | null>(
    null
  );
  const { completeDate } = useDashboardDate();

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const dados = await getDashboardEquipe({
          mes: completeDate.month() + 1,
          ano: completeDate.year(),
        });
        setResposta(dados);
      } catch (err) {
        console.error(err);
        setResposta(null);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [completeDate]);

  useEffect(() => {
    getClientesInativosEquipe({ diasSemComprar: 90 })
      .then((res) => setClientesInativos(res.data ?? []))
      .catch((err) => console.error(err));
  }, []);

  const vendas = resposta?.vendas;
  const faturamento = resposta?.faturamento;
  const classificacaoPedidos = resposta?.classificacaoPedidos;
  const corGauge = 'var(--green)';
  const mediaPorPedido = vendas && vendas.quantidade > 0 ? vendas.valor / vendas.quantidade : 0;
  const trilha = vendas ? trilhaMeta(vendas.percAtingimento) : null;

  return (
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Dashboard da Equipe" subtitle="Vendas e faturamento de todos os vendedores" />
        <MesSeletor />
      </div>
      <PageContent>
        {loading ? (
          <div className={styles.loading}>
            <CircularProgress size={50} />
            <span>Carregando...</span>
          </div>
        ) : !vendas || !faturamento ? (
          <div className={styles.emptyState}>
            <p>Não foi possível carregar os dados da equipe.</p>
          </div>
        ) : (
          <>
            <div className={styles.hero}>
              <div className={styles.heroGaugeCol}>
                <Gauge size={168} value={vendas.percAtingimento} color={corGauge} gradientFrom="var(--blue)" />
                {trilha && (
                  <div className={styles.trilhaMeta}>
                    <div className={styles.track}>
                      <div
                        className={styles.trackFill}
                        style={{ width: `${trilha.fracao * 100}%`, background: trilha.cor }}
                      />
                    </div>
                    <div className={styles.trackTicks}>
                      <span>{trilha.baseAnterior}%</span>
                      <span>{trilha.limite}%</span>
                    </div>
                    <div className={styles.trackLabel} style={{ color: trilha.cor }}>
                      {trilha.completo ? `Meta de ${trilha.limite}% batida` : `Rumo aos ${trilha.limite}%`}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.heroBody}>
                <h2>
                  {toBRL(vendas.valor)}{' '}
                  <span style={{ fontWeight: 400, color: 'var(--foreground-secondary)' }}>
                    vendidos no mês
                  </span>
                </h2>
                <p className={styles.sub}>
                  {vendas.quantidade} pedido{vendas.quantidade === 1 ? '' : 's'}
                  {vendas.quantidade > 0 && ` · média de ${toBRL(mediaPorPedido)} por pedido`}
                </p>
                {(() => {
                  const variacao = variacaoPerc(vendas.valor, vendas.valorMesAnterior);
                  if (variacao === null) return null;
                  const subiu = variacao >= 0;
                  return (
                    <p
                      className={styles.comparacaoMesAnterior}
                      // --danger (não --red-light): texto direto no fundo da página, não
                      // numa superfície escura — --red-light é o tom pálido pra contraste
                      // sobre fundo escuro/colorido, ficava quase ilegível no tema claro.
                      style={{ color: subiu ? 'var(--green)' : 'var(--danger)' }}
                    >
                      {subiu ? '▲' : '▼'} {Math.abs(variacao).toFixed(1)}% vs. {toBRL(vendas.valorMesAnterior)}{' '}
                      no mês passado
                    </p>
                  );
                })()}
                <div className={styles.heroMetrics}>
                  <div className={styles.heroMetric}>
                    <div className="n">{toBRL(vendas.meta)}</div>
                    <div className="l">Meta do mês</div>
                  </div>
                  <div className={styles.heroMetric}>
                    <div className="n">{toBRL(vendas.valorHoje)}</div>
                    <div className="l">Vendido hoje</div>
                  </div>
                  <div className={styles.heroMetric}>
                    <div className="n">{vendas.pedidosHoje}</div>
                    <div className="l">Pedidos hoje</div>
                  </div>
                </div>
              </div>
            </div>

            <p className={styles.sectionLabel}>
              <span className={`${styles.titleDot} ${styles.dotGold}`} />
              Faturamento do mês
            </p>
            <div className={styles.tiles}>
              <div className={styles.tile}>
                <p className={styles.tileLabel}>Total faturado</p>
                <p className={`${styles.tileValue} ${styles.tileValueAccent}`}>
                  {toBRL(faturamento.valor)}
                </p>
                <p className={styles.tileSub}>
                  {faturamento.quantidade} nota{faturamento.quantidade === 1 ? '' : 's'} fiscal
                  {faturamento.quantidade === 1 ? '' : 'is'} emitida
                  {faturamento.quantidade === 1 ? '' : 's'}
                </p>
                {(() => {
                  const variacao = variacaoPerc(faturamento.valor, faturamento.valorMesAnterior);
                  if (variacao === null) return null;
                  const subiu = variacao >= 0;
                  return (
                    <p
                      className={styles.tileSub}
                      style={{ color: subiu ? 'var(--green)' : 'var(--danger)' }}
                    >
                      {subiu ? '▲' : '▼'} {Math.abs(variacao).toFixed(1)}% vs. mês passado
                    </p>
                  );
                })()}
              </div>
              <div className={styles.tile}>
                <p className={styles.tileLabel}>% da meta batida</p>
                <p
                  className={styles.tileValue}
                  style={{ color: corPorMetaBatida(faturamento.percAtingimento) }}
                >
                  {faturamento.percAtingimento.toFixed(1)}%
                </p>
                <p className={styles.tileSub}>meta de faturamento: {toBRL(faturamento.meta)}</p>
              </div>
              <div className={styles.tile}>
                <p className={styles.tileLabel}>Faturado hoje</p>
                <p className={styles.tileValue}>{toBRL(faturamento.valorHoje)}</p>
                <p className={styles.tileSub}>{faturamento.pedidosHoje} pedido(s) faturado(s) hoje</p>
              </div>
            </div>

            {resposta?.proximosVencimentos && resposta.proximosVencimentos.length > 0 && (
              <>
                <p className={styles.sectionLabel}>
                  <span className={`${styles.titleDot} ${styles.dotOrange}`} />
                  Próximos vencimentos
                </p>
                <div className={styles.listaClientes}>
                  {resposta.proximosVencimentos.map((p) => {
                    const sla = calcularSlaPedido(p.data_previsao, false);
                    const urgente = sla?.tier !== 'normal';
                    return (
                      <div key={p.codigo_pedido_omie} className={styles.linhaCliente}>
                        <div className={styles.linhaClienteTopo}>
                          <span className={styles.nomeCliente}>
                            {p.cliente}
                            {p.numero_pedido && (
                              <span style={{ color: 'var(--foreground-secondary)' }}>
                                {' '}
                                · Pedido {p.numero_pedido}
                              </span>
                            )}
                            {p.vendedor && (
                              <span style={{ color: 'var(--foreground-secondary)' }}> · {p.vendedor}</span>
                            )}
                            {p.etapa_descricao && (
                              <span style={{ color: 'var(--foreground-secondary)' }}>
                                {' '}
                                · {p.etapa_descricao}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className={styles.linhaClienteMeta}>
                          <span
                            className={styles.pedidosCliente}
                            style={urgente ? { color: 'var(--danger)', fontWeight: 'var(--w-semibold)' } : undefined}
                          >
                            {sla?.texto ?? dateFormatter(p.data_previsao)}
                          </span>
                          <span className={styles.valorCliente}>{toBRL(p.total_pedido)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {classificacaoPedidos && (
              <>
                <p className={styles.sectionLabel}>
                  <span className={`${styles.titleDot} ${styles.dotBlue}`} />
                  Classificação dos pedidos
                </p>
                <div className={styles.tiles}>
                  {TIPOS.map((tipo) => {
                    const item = classificacaoPedidos[tipo];
                    const cor = TIPO_CONTRATO_COLORS[tipo];
                    const semClassificacao = tipo === 'SEM CLASSIFICAÇÃO';
                    return (
                      <div
                        key={tipo}
                        className={styles.tile}
                        style={semClassificacao && item.quantidade > 0 ? { borderColor: cor } : undefined}
                      >
                        <p className={styles.tileLabel} style={{ color: cor }}>
                          {tipo}
                        </p>
                        <p className={styles.tileValue}>
                          {item.quantidade} pedido{item.quantidade === 1 ? '' : 's'}
                        </p>
                        <p className={styles.tileSub}>{toBRL(item.valor)}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {resposta?.topClientes && resposta.topClientes.length > 0 && (
              <>
                <p className={styles.sectionLabel}>
                  <span className={`${styles.titleDot} ${styles.dotGreen}`} />
                  Melhores clientes da empresa no mês
                </p>
                <div className={styles.listaClientes}>
                  {(verTodosTopClientes
                    ? resposta.topClientes
                    : resposta.topClientes.slice(0, LIMITE_INICIAL_TOP_CLIENTES)
                  ).map((c, i) => (
                    <div
                      key={`${c.codigo_empresa}-${c.codigo_cliente ?? c.cliente}-${i}`}
                      className={styles.linhaCliente}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setClienteSelecionado({
                          nome: c.cliente,
                          codigoCliente: c.codigo_cliente,
                          codigoEmpresa: c.codigo_empresa,
                          valorMes: c.valor,
                          qtdPedidosMes: c.qtd_pedidos,
                        })
                      }
                    >
                      <div className={styles.linhaClienteTopo}>
                        <span className={styles.posicaoCliente}>{i + 1}º</span>
                        <span className={styles.nomeCliente}>{c.cliente}</span>
                      </div>
                      <div className={styles.linhaClienteMeta}>
                        <span className={styles.pedidosCliente}>
                          {c.unidade} · {c.qtd_pedidos} pedido{c.qtd_pedidos === 1 ? '' : 's'}
                        </span>
                        <span className={styles.valorCliente}>{toBRL(c.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {resposta.topClientes.length > LIMITE_INICIAL_TOP_CLIENTES && (
                  <div className={styles.verMaisWrapper}>
                    <Button variant="ghost" onClick={() => setVerTodosTopClientes((v) => !v)}>
                      {verTodosTopClientes ? 'Ver menos' : 'Ver mais'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {resposta?.topProdutos && resposta.topProdutos.length > 0 && (
              <>
                <p className={styles.sectionLabel}>
                  <span className={`${styles.titleDot} ${styles.dotPink}`} />
                  Produtos mais vendidos da empresa no mês
                </p>
                <div className={styles.listaClientes}>
                  {(verTodosTopProdutos
                    ? resposta.topProdutos
                    : resposta.topProdutos.slice(0, LIMITE_INICIAL_TOP_PRODUTOS)
                  ).map((produto, i) => (
                    <div key={produto.codigo_produto} className={styles.linhaCliente}>
                      <div className={styles.linhaClienteTopo}>
                        <span className={styles.posicaoCliente}>{i + 1}º</span>
                        <span className={styles.nomeCliente}>{produto.descricao}</span>
                      </div>
                      <div className={styles.linhaClienteMeta}>
                        <span className={styles.pedidosCliente}>{produto.quantidade} un.</span>
                        <span className={styles.valorCliente}>{toBRL(produto.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {resposta.topProdutos.length > LIMITE_INICIAL_TOP_PRODUTOS && (
                  <div className={styles.verMaisWrapper}>
                    <Button variant="ghost" onClick={() => setVerTodosTopProdutos((v) => !v)}>
                      {verTodosTopProdutos ? 'Ver menos' : 'Ver mais'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {clientesInativos.length > 0 && (
              <>
                <p className={styles.sectionLabel}>
                  <span className={`${styles.titleDot} ${styles.dotRed}`} />
                  Clientes sem comprar há 90+ dias
                </p>
                <div className={styles.listaClientes}>
                  {(verTodosInativos
                    ? clientesInativos
                    : clientesInativos.slice(0, LIMITE_INICIAL_INATIVOS)
                  ).map((c) => (
                    <div
                      key={`${c.codigo_empresa}-${c.codigo_cliente}`}
                      className={styles.linhaCliente}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setClienteSelecionado({
                          nome: c.cliente,
                          codigoCliente: c.codigo_cliente,
                          codigoEmpresa: c.codigo_empresa,
                          qtdPedidosMes: Number(c.qtd_pedidos) || 0,
                          valorUltimaCompra: Number(c.valor_ultima_compra) || 0,
                          valorTotalHistorico: Number(c.valor_total_historico) || 0,
                          ultimaCompra: c.ultima_compra,
                          diasSemComprar: c.dias_sem_comprar,
                        })
                      }
                    >
                      <div className={styles.linhaClienteTopo}>
                        <span className={styles.nomeCliente}>{c.cliente}</span>
                      </div>
                      <div className={styles.linhaClienteMeta}>
                        <span className={styles.pedidosCliente}>
                          {c.unidade} · {c.vendedor} · última compra em {dateFormatter(c.ultima_compra)}
                        </span>
                        <span className={styles.diasCliente}>{c.dias_sem_comprar} dias</span>
                      </div>
                    </div>
                  ))}
                </div>
                {clientesInativos.length > LIMITE_INICIAL_INATIVOS && (
                  <div className={styles.verMaisWrapper}>
                    <Button variant="ghost" onClick={() => setVerTodosInativos((v) => !v)}>
                      {verTodosInativos ? 'Ver menos' : 'Ver mais'}
                    </Button>
                  </div>
                )}
              </>
            )}
            <div className={styles.bottomSpacer} aria-hidden="true" />
          </>
        )}
      </PageContent>
      <ClienteDetalhesModalEquipe
        key={clienteSelecionado?.codigoCliente ?? clienteSelecionado?.nome}
        isOpen={clienteSelecionado !== null}
        onClose={() => setClienteSelecionado(null)}
        cliente={clienteSelecionado}
        mes={completeDate.month() + 1}
        ano={completeDate.year()}
      />
    </div>
  );
}
