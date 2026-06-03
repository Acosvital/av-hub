import Card from '@/components/Ui/Card/Card';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import toBRL from '@/utils/toBRL';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';

export default function Usuarios() {
  return (
    <div className={`${styles.dashboardContainer}`}>
      <DashboardGrid>
        <DashboardWidget cols={6} rows={4}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
              <span className={styles.rankingSubtitle}>37 vendedores</span>
            </div>
            <div className={styles.fixedRank}>
              Destaques do Pódio
              <div className={styles.top3Container}>
                <VendorCard
                  name='HUGO DOS SANTOS GONÇALVES'
                  orders='100'
                  meta='10'
                  participation='34'
                  totalValue={3000450}
                  rank={1}
                />
                <VendorCard
                  name='GABRIEL DE DEUS NICOLAU'
                  orders='100'
                  meta='10'
                  participation='30'
                  totalValue={2500450}
                  rank={2}
                />
                <VendorCard
                  name='Nathan Lucca'
                  orders='100'
                  meta='10'
                  participation='25'
                  totalValue={2000450}
                  rank={3}
                />
              </div>
            </div>
            <div className={styles.defaultRank}>
              <VendorCard
                name='HUGO DOS SANTOS GONÇALVES'
                orders='100'
                meta='10'
                participation='34'
                totalValue={3000450}
                rank={4}
              />
              <VendorCard
                name='HUGO DOS SANTOS GONÇALVES'
                orders='100'
                meta='10'
                participation='34'
                totalValue={3000450}
                rank={5}
              />
              <VendorCard
                name='HUGO DOS SANTOS GONÇALVES'
                orders='100'
                meta='10'
                participation='34'
                totalValue={3000450}
                rank={5}
              />
              <VendorCard
                name='HUGO DOS SANTOS GONÇALVES'
                orders='100'
                meta='10'
                participation='34'
                totalValue={3000450}
                rank={5}
              />
              <VendorCard
                name='HUGO DOS SANTOS GONÇALVES'
                orders='100'
                meta='10'
                participation='34'
                totalValue={3000450}
                rank={5}
              />
              <VendorCard
                name='HUGO DOS SANTOS GONÇALVES'
                orders='100'
                meta='10'
                participation='34'
                totalValue={3000450}
                rank={5}
              />
              <VendorCard
                name='HUGO DOS SANTOS GONÇALVES'
                orders='100'
                meta='10'
                participation='34'
                totalValue={3000450}
                rank={5}
              />
              <VendorCard
                name='HUGO DOS SANTOS GONÇALVES'
                orders='100'
                meta='10'
                participation='34'
                totalValue={3000450}
                rank={5}
              />
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={3} rows={2}>
          <Card>
            <p>Gauge</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={3} rows={2}>
          <Card>
            <p>Spot</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={2} rows={1}>
          <Card>
            <p>Fat. diario</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={4} rows={2}>
          <Card>
            <p>ritmo meta</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={2} rows={1}>
          <Card>
            <p>vol. pedidos</p>
          </Card>
        </DashboardWidget>
      </DashboardGrid>
    </div>
  )
}