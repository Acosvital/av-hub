'use client';

import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import Gauge from '@/components/Charts/Gauge/Gauge';
import MesSeletor from '@/components/Ui/MesSeletor/MesSeletor';
import useDashboardDate from '@/hooks/useDashboardDate';
import { getMeuDashboard } from '@/services/portalVendedor/meuDashboard';
import { getClientesInativos } from '@/services/portalVendedor/clientesInativos';
import { ClienteInativoProps, MeuDashboardResponse, TipoContrato } from './types';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import TIPO_CONTRATO_COLORS from '@/utils/tipoContratoColors';
import styles from './styles.module.css';

const TIPOS: TipoContrato[] = ['SPOT', 'CONTRATO', 'SEM CLASSIFICAÇÃO'];

// Mesma régua de cor por faixa de meta batida do VendorCard/dash-vendas —
// exclusiva do lado de Vendas (docs/portal-vendedor/plano-portal-vendedor.md, seção 4.1).
function corMeta(percMeta: number) {
  if (percMeta <= 100) return 'var(--blue)';
  if (percMeta <= 200) return 'var(--green)';
  if (percMeta <= 300) return 'var(--orange)';
  if (percMeta <= 400) return 'var(--pink)';
  return 'var(--gold)';
}

export default function MeuDashboard() {
  const [loading, setLoading] = useState(true);
  const [resposta, setResposta] = useState<MeuDashboardResponse | null>(null);
  const [clientesInativos, setClientesInativos] = useState<ClienteInativoProps[]>([]);
  const { completeDate } = useDashboardDate();

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const dados = await getMeuDashboard({
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
  const corGauge = vendas ? corMeta(vendas.perc_meta) : 'var(--blue)';
  const mediaPorPedido = vendas && vendas.quantidade > 0 ? vendas.valor / vendas.quantidade : 0;

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
              <Gauge size={168} value={vendas.perc_meta} color={corGauge} />
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

            <p className={styles.sectionLabel}>Faturamento do mês</p>
            <div className={styles.tiles}>
              <div className={styles.tile}>
                <p className={styles.tileLabel}>Total faturado</p>
                <p className={styles.tileValue}>{toBRL(faturamento.valor)}</p>
                <p className={styles.tileSub}>
                  {faturamento.quantidade} nota{faturamento.quantidade === 1 ? '' : 's'} fiscal
                  {faturamento.quantidade === 1 ? '' : 'is'} emitida
                  {faturamento.quantidade === 1 ? '' : 's'}
                </p>
              </div>
              <div className={styles.tile}>
                <p className={styles.tileLabel}>% da meta individual batida</p>
                <p className={styles.tileValue}>{faturamento.perc_meta.toFixed(1)}%</p>
                <p className={styles.tileSub}>sem régua de cor por faixa neste indicador</p>
              </div>
              <div className={styles.tile}>
                <p className={styles.tileLabel}>Participação na meta total</p>
                <p className={styles.tileValue}>{faturamento.perc_participacao.toFixed(1)}%</p>
                <p className={styles.tileSub}>meta de faturamento: {toBRL(faturamento.meta_total)}</p>
              </div>
            </div>

            {classificacaoPedidos && (
              <>
                <p className={styles.sectionLabel}>Classificação dos meus pedidos</p>
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
                <p className={styles.sectionLabel}>Meus melhores clientes no mês</p>
                <div className={styles.listaClientes}>
                  {resposta.topClientes.map((c, i) => (
                    <div key={c.cliente} className={styles.linhaCliente}>
                      <span className={styles.posicaoCliente}>{i + 1}º</span>
                      <span className={styles.nomeCliente}>{c.cliente}</span>
                      <span className={styles.pedidosCliente}>
                        {c.qtd_pedidos} pedido{c.qtd_pedidos === 1 ? '' : 's'}
                      </span>
                      <span className={styles.valorCliente}>{toBRL(c.valor)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {clientesInativos.length > 0 && (
              <>
                <p className={styles.sectionLabel}>Clientes sem comprar há 90+ dias</p>
                <div className={styles.listaClientes}>
                  {clientesInativos.slice(0, 8).map((c) => (
                    <div key={c.codigo_cliente} className={styles.linhaCliente}>
                      <span className={styles.nomeCliente}>{c.cliente}</span>
                      <span className={styles.pedidosCliente}>
                        última compra em {dateFormatter(c.ultima_compra)}
                      </span>
                      <span className={styles.diasCliente}>{c.dias_sem_comprar} dias</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </PageContent>
    </div>
  );
}
