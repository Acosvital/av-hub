'use client';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import Card from '@/components/Ui/Card/Card';
import RevenueGauge from '@/components/Dashboards/RevenueGauge/RevenueGauge';
import GoalPaceCard from '@/components/Dashboards/GoalPaceCard/GoalPaceCard';
import Image from 'next/image';
import toBRL from '@/utils/toBRL';

const vendor = (
  <VendorCard
    name='HUGO DOS SANTOS GONÇALVES'
    orders={100}
    meta={10}
    participation={34}
    totalValue={3000450}
    rank={1}
  />
);
const vendors = new Array(9).fill(vendor);
const top3 = vendors.slice(0, 3);
const otherVendors = vendors.slice(3);

export default function Faturamento() {
  const scrollDuration = `${otherVendors.length * 1.7}s`;

  return (
    <div className={styles.dashboardContainer}>
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
              {/* Se o tamanho do Array dos vendedores for menor que 8, não adicionar autoScroll - vai ficar estranho! */}
              <div
                className={`${vendors.length > 8 && styles.autoScroll}`}
                style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
              >
                <div className={styles.vendorGroup}>
                  {otherVendors.map((vendor) => (
                    vendor
                  ))}
                </div>
                <div className={styles.vendorGroup} aria-hidden="true">
                  {vendors.length >= 9 && (
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
            <Image src='/logo.png' alt='Aços Vital' width={200} height={43} />
          </div>
        </DashboardWidget>
        <DashboardWidget cols={5} rows={2}>
          <Card>
            <h3>Ritmo de faturamento</h3>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={2} rows={3}>
          <RevenueGauge
            value={90}
            target="30 MI"
            totalRevenue={23119350}
            lastMonthRevenue={23119350}
            lastMonthOrders={1029}
          />
        </DashboardWidget>
        <DashboardWidget cols={5} rows={1}>
          <GoalPaceCard
            status="below"
            idealDailyTarget={1136363.64}
            currentDailyTarget={399468.64}
            workingDays={22}
            elapsedDays={2}
          />
        </DashboardWidget>
        <DashboardWidget cols={2} rows={3}>
          <div className={styles.defaultCard}>
            <h3>Tipo de faturamento</h3>
            <div className={styles.billings}>
              <div className={styles.billing}>
                <h3>SPOT</h3>
                <span>{toBRL(100136363.64)}</span>
              </div>
              <div className={styles.billing}>
                <h3>Contrato</h3>
                <span>{toBRL(100136363.64)}</span>
              </div>
              <div className={styles.billing}>
                <h3>Sem Classificação</h3>
                <span>{toBRL(100136363.64)}</span>
              </div>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={3} rows={3}>
          <div className={styles.defaultCard}>
            <h3>Situação</h3>
            <div className={styles.situationGroup}>
              <div className={styles.situationCard}>
                <div>
                  <h4 className={styles.situationTitle}>Cancelados</h4>
                  <span>50</span>
                </div>
                <div>
                  <span>{toBRL(100136363.64)}</span>
                </div>
              </div>
              <div className={styles.situationCard}>
                <div>
                  <h4 className={styles.situationTitle}>Devolvidos</h4>
                  <span>50</span>
                </div>
                <div>
                  <span>{toBRL(100136363.64)}</span>
                </div>
              </div>
              <div className={styles.situationCard}>
                <div>
                  <h4 className={styles.situationTitle}>Recusados</h4>
                  <span>50</span>
                </div>
                <div>
                  <span>{toBRL(100136363.64)}</span>
                </div>
              </div>
              <div className={styles.situationCard}>
                <div>
                  <h4 className={styles.situationTitle}>Refaturamento</h4>
                  <span>50</span>
                </div>
                <div>
                  <span>{toBRL(100136363.64)}</span>
                </div>
              </div>
            </div>
          </div >
        </DashboardWidget>
        <DashboardWidget cols={2} rows={2}>
          <div className={styles.defaultCard}>
            <div>
              <h3>Faturamento Diário</h3>
              <div className={styles.billingCard}>
                <div>
                  <h4 className={styles.billingTitle}>Hoje</h4>
                  <span className={styles.billingValue}>{toBRL(100136363.64)}</span>
                </div>
                <div>
                  <h4 className={styles.billingTitle}>Ontem</h4>
                  <span className={styles.billingValue}>{toBRL(100136363.64)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3>Volume de Pedidos</h3>
              <div className={styles.billingCard}>
                <div>
                  <h4 className={styles.billingTitle}>Hoje</h4>
                  <span className={styles.billingValue}>8400</span>
                </div>
                <div>
                  <h4 className={styles.billingTitle}>Ontem</h4>
                  <span className={styles.billingValue}>488</span>
                </div>
              </div>
            </div>
          </div>
        </DashboardWidget>
      </DashboardGrid>
    </div>
  );
}
