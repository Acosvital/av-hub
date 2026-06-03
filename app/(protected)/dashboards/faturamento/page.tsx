'use client';
import Card from '@/components/Ui/Card/Card';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';

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
        <DashboardWidget cols={5} rows={4}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
              <span className={styles.rankingSubtitle}>37 vendedores</span>
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
        <DashboardWidget cols={3} rows={2}>
          <Card>
            <p>Gauge</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={4} rows={2}>
          <Card>
            <p>Spot</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={3} rows={1}>
          <Card>
            <p>Fat. diario</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={4} rows={2}>
          <Card>
            <p>ritmo meta</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={3} rows={1}>
          <Card>
            <p>vol. pedidos</p>
          </Card>
        </DashboardWidget>
      </DashboardGrid>
    </div>
  )
}
