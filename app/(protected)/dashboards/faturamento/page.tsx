'use client';
import Card from '@/components/Ui/Card/Card';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import Gauge from '@/components/Charts/Gauge/Gauge';
import toBRL from '@/utils/toBRL';
import Image from 'next/image';
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { ImClock } from 'react-icons/im';

const vendor = (
  <VendorCard
    name='HUGO DOS SANTOS GONÇALVES'
    orders='100'
    meta='10'
    participation='34'
    totalValue={3000450}
    rank={1}
  />
)
const vendors = new Array(8).fill(vendor);
const top3 = vendors.slice(0, 3);
const otherVendors = vendors.slice(3, vendors.length);

export default function Usuarios() {
  return (
    <div className={`${styles.dashboardContainer}`}>
      <DashboardGrid>
        <DashboardWidget cols={5} rows={6}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
              <span>37 vendedores</span>
            </div>
            <div className={styles.fixedRank}>
              Destaques do Pódio
              <div className={styles.top3Container}>
                {top3.map((vendor) => (
                  vendor
                ))}
              </div>
            </div>
            <div className={styles.defaultRank}>
              {/* Se o tamanho do Array dos vendedores for menor que 8, não adicionar autoScroll - vai ficar estranho */}
              <div className={`${vendors.length >= 8 && styles.autoScroll}`}>
                <div className={styles.vendorGroup}>
                  {otherVendors.map((vendor) => (
                    vendor
                  ))}
                </div>
                <div className={styles.vendorGroup} aria-hidden="true">
                  {vendors.length >= 8 && (
                    otherVendors.map((vendor) => (
                      vendor
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={2} rows={1}>
          <div className={styles.logoContainer}>
            <Image src={'/logo.png'} alt='Aços Vital' width={200} height={43} />
          </div>
        </DashboardWidget>
        <DashboardWidget cols={5} rows={2}>
          <Card>
            <p>Ritmo de faturamento</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={2} rows={3}>
          <div className={styles.gaugeContainer}>
            <Gauge
              size={250}
              value={90}
              color='var(--gold)'
            />
            <div className={styles.totalRevenueValues}>
              <div>
                <h2 className={styles.defaultTitle}>faturamento total</h2>
                <h4 className={styles.revenueValue}>{toBRL(23119350)}</h4>
              </div>
              <div>
                <h2 className={styles.defaultTitle}>Meta</h2>
                <h4 className={styles.meta}>{'30 MI'}</h4>
              </div>
            </div>
            <div className={styles.totalRevenueValues}>
              {/* <ImClock /> */}
              <div>
                <h2 className={styles.defaultSubtitle}>Mês Passado</h2>
                <h4 className={styles.secondarySubtitle}>{toBRL(23119350)}</h4>
              </div>
              <div>
                <h2 className={styles.defaultSubtitle}>Pedidos M. P.</h2>
                <h4 className={styles.secondarySubtitle}>{'1029'}</h4>
              </div>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={5} rows={1}>
          <div className={styles.goalPaceContainer}>
            <div className={styles.sectionHeader}>
              <h4>Ritmo de meta</h4>
              <div className={styles.pill}>
                <FaArrowTrendDown size={14} />
                <span>ABAIXO</span>
              </div>
            </div>
            <div className={styles.metaCards}>
              <div className={styles.metaCard}>
                <h4 className={styles.textSm}>Meta Diária Ideal</h4>
                <h3 className={styles.textLg}>{toBRL(1136363.64)}</h3>
                <span className={styles.textXs}>Base: 22D Úteis</span>
              </div>
              <div className={styles.metaCard}>
                <h4 className={styles.textSm}>Meta Diária Atual</h4>
                <h3 className={styles.textLg}>{toBRL(399468.64)}</h3>
                <span className={styles.textXs}>Base: 2D Decorridos</span>
              </div>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={2} rows={3}>
          <Card>
            <p>Tipo de faturamento</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={3} rows={3}>
          <Card>
            <p>Situação</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={2} rows={2}>
          <div>
            <p>Faturamento Diário</p>
          </div>
        </DashboardWidget>
      </DashboardGrid>
    </div>
  )
}
