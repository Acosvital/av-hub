'use client';

import { useCallback, useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import Gauge from '@/components/Charts/Gauge/Gauge';
import Button from '@/components/Ui/Button/Button';
import MesSeletor from '@/components/Ui/MesSeletor/MesSeletor';
import ClienteDetalhesModal, {
  ClienteDetalhesProps,
} from '@/components/Dashboards/ClienteDetalhesModal/ClienteDetalhesModal';
import useDashboardDate from '@/hooks/useDashboardDate';
import useAutoRefresh from '@/hooks/useAutoRefresh';
import { getMeuDashboard } from '@/services/portalVendedor/meuDashboard';
import { getClientesInativos } from '@/services/portalVendedor/clientesInativos';
import { ClienteInativoProps, MeuDashboardResponse, TipoContrato } from './types';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import TIPO_CONTRATO_COLORS from '@/utils/tipoContratoColors';
import { trilhaMeta, corPorMetaBatida } from '@/utils/metaColor';
import { calcularSlaPedido } from '@/utils/slaPedido';
import styles from './styles.module.css';

const TIPOS: TipoContrato[] = ['SPOT', 'CONTRATO', 'SEM CLASSIFICAÇÃO'];

// Variação percentual vs. mês anterior (seção 8.3 do plano) — null quando
// não há base de comparação (mês anterior zerado), pra não mostrar "+∞%".
function variacaoPerc(atual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

// Quantidade exibida antes do "ver mais" em cada ranking — nomes de cliente
// longos truncavam em uma linha só; a lista deixou de mostrar tudo de uma
// vez pra caber sem cortar, com o "ver mais" liberando o resto.
const LIMITE_INICIAL_TOP_CLIENTES = 5;
const LIMITE_INICIAL_INATIVOS = 8;
const LIMITE_INICIAL_TOP_PRODUTOS = 5;

export default function MeuDashboard() {
  const [loading, setLoading] = useState(true);
  const [resposta, setResposta] = useState<MeuDashboardResponse | null>(null);
  const [clientesInativos, setClientesInativos] = useState<ClienteInativoProps[]>([]);
  const [verTodosTopClientes, setVerTodosTopClientes] = useState(false);
  const [verTodosTopProdutos, setVerTodosTopProdutos] = useState(false);
  const [verTodosInativos, setVerTodosInativos] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteDetalhesProps | null>(null);
  const { completeDate } = useDashboardDate();

  // silent=true (chamado pelo auto-refresh) não mexe no loading — sem isso,
  // o dashboard inteiro voltaria a mostrar o spinner a cada 1min.
  const carregar = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const dados = await getMeuDashboard({
          mes: completeDate.month() + 1,
          ano: completeDate.year(),
        });
        setResposta(dados);
      } catch (err) {
        console.error(err);
        // Num refresh silencioso, um erro passageiro não deve apagar o
        // dashboard inteiro — mantém o último dado bom na tela.
        if (!silent) setResposta(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [completeDate]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Mantém o dashboard atualizado sozinho (a cada 1min, pausado com a aba
  // em background) — ver hooks/useAutoRefresh.ts.
  useAutoRefresh(() => carregar(true));

  // Clientes inativos não depende do mês selecionado (é "há quantos dias sem
  // comprar", olhando pra trás no tempo) — busca uma vez só, ao montar.
  useEffect(() => {
    getClientesInativos({ diasSemComprar: 90 })
      .then((res) => setClientesInativos(res.data ?? []))
      .catch((err) => console.error(err));
  }, []);

  const vendas = resposta?.vendas;
  const faturamento = resposta?.faturamento;
  const classificacaoPedidos = resposta?.classificacaoPedidos;
  // Mesma cor do gauge do dashboard de vendas (admin) — dash-vendas usa
  // sempre verde/azul fixo pro hero, independente da meta batida (só as
  // VendorCard do ranking usam a régua de cor por faixa). Aqui a régua de
  // faixa vira a trilha de progresso abaixo do gauge, não a cor do gauge em si.
  const corGauge = 'var(--green)';
  const mediaPorPedido = vendas && vendas.quantidade > 0 ? vendas.valor / vendas.quantidade : 0;
  const trilha = vendas ? trilhaMeta(vendas.perc_meta) : null;

  return (
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Meu Dashboard" subtitle="Resumo das suas vendas e faturamento no mês" />
        <MesSeletor />
      </div>
      <PageContent>
        {loading ? (
          <div className={styles.loading}>
            <CircularProgress size={50} />
            <span>Carregando...</span>
          </div>
        ) : !resposta?.vinculado || !vendas || !faturamento ? (
          <div className={styles.emptyState}>
            <p>
              Seu usuário ainda não está vinculado a um vendedor. Fale com o time de acessos para
              configurar esse vínculo.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.hero}>
              <div className={styles.heroGaugeCol}>
                <Gauge size={168} value={vendas.perc_meta} color={corGauge} gradientFrom="var(--blue)" />
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
                {resposta.comparacaoMesAnterior &&
                  (() => {
                    const variacao = variacaoPerc(
                      vendas.valor,
                      resposta.comparacaoMesAnterior.vendas.valor
                    );
                    if (variacao === null) return null;
                    const subiu = variacao >= 0;
                    return (
                      <p
                        className={styles.comparacaoMesAnterior}
                        // --danger (não --red-light): esse texto fica direto no fundo da
                        // página, não numa superfície escura — --red-light é o tom pálido
                        // pensado pra contraste sobre fundo escuro/colorido, e no tema claro
                        // ficava quase ilegível (rosa claro sobre branco).
                        style={{ color: subiu ? 'var(--green)' : 'var(--danger)' }}
                      >
                        {subiu ? '▲' : '▼'} {Math.abs(variacao).toFixed(1)}% vs.{' '}
                        {toBRL(resposta.comparacaoMesAnterior.vendas.valor)} no mês passado
                      </p>
                    );
                  })()}
                <div className={styles.heroMetrics}>
                  <div className={styles.heroMetric}>
                    <div className="n">{toBRL(vendas.meta_individual)}</div>
                    <div className="l">Meta individual</div>
                  </div>
                  <div className={styles.heroMetric}>
                    <div className="n">{vendas.perc_participacao.toFixed(1)}%</div>
                    <div className="l">Participação na meta total</div>
                  </div>
                  <div className={styles.heroMetric}>
                    <div className="n">{toBRL(vendas.meta_total)}</div>
                    <div className="l">Meta total do mês</div>
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
                {resposta.comparacaoMesAnterior &&
                  (() => {
                    const variacao = variacaoPerc(
                      faturamento.valor,
                      resposta.comparacaoMesAnterior.faturamento.valor
                    );
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
                <p className={styles.tileLabel}>% da meta individual batida</p>
                <p
                  className={styles.tileValue}
                  style={{ color: corPorMetaBatida(faturamento.perc_meta) }}
                >
                  {faturamento.perc_meta.toFixed(1)}%
                </p>
                <p className={styles.tileSub}>sem régua de cor por faixa neste indicador</p>
              </div>
              <div className={styles.tile}>
                <p className={styles.tileLabel}>Participação na meta total</p>
                <p className={styles.tileValue}>{faturamento.perc_participacao.toFixed(1)}%</p>
                <p className={styles.tileSub}>meta de faturamento: {toBRL(faturamento.meta_total)}</p>
              </div>
            </div>

            {resposta.proximosVencimentos && resposta.proximosVencimentos.length > 0 && (
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
                  Classificação dos meus pedidos
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
                        {semClassificacao &&
                          (item.quantidade > 0 ? (
                            <p className={styles.tileAlerta}>
                              Classifique esses pedidos como SPOT ou Contrato — a meta é zerar
                              &ldquo;sem classificação&rdquo;.
                            </p>
                          ) : (
                            <p className={styles.tileSub}>Tudo classificado 🎉</p>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {resposta.topClientes && resposta.topClientes.length > 0 && (
              <>
                <p className={styles.sectionLabel}>
                  <span className={`${styles.titleDot} ${styles.dotGreen}`} />
                  Meus melhores clientes no mês
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

            {resposta.topProdutos && resposta.topProdutos.length > 0 && (
              <>
                <p className={styles.sectionLabel}>
                  <span className={`${styles.titleDot} ${styles.dotPink}`} />
                  Meus produtos mais vendidos no mês
                </p>
                <div className={styles.listaClientes}>
                  {(verTodosTopProdutos
                    ? resposta.topProdutos
                    : resposta.topProdutos.slice(0, LIMITE_INICIAL_TOP_PRODUTOS)
                  ).map((produto, i) => (
                    <div key={`${produto.codigo_empresa}-${produto.codigo_produto}`} className={styles.linhaCliente}>
                      <div className={styles.linhaClienteTopo}>
                        <span className={styles.posicaoCliente}>{i + 1}º</span>
                        <span className={styles.nomeCliente}>{produto.descricao}</span>
                      </div>
                      <div className={styles.linhaClienteMeta}>
                        <span className={styles.pedidosCliente}>
                          {produto.unidade} · {produto.quantidade} un.
                        </span>
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
                          {c.unidade} · última compra em {dateFormatter(c.ultima_compra)}
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
            {/* Spacer real (altura de verdade, não margin/padding) pro
                respiro final da página — quem rola aqui é o .mainArea por
                fora (Layout.module.css), e margin/padding no fim de um
                container flex com overflow não é contado de forma
                confiável no scrollHeight (bug do Chromium); um elemento com
                altura própria não sofre desse problema. */}
            <div className={styles.bottomSpacer} aria-hidden="true" />
          </>
        )}
      </PageContent>
      <ClienteDetalhesModal
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
