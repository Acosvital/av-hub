'use client';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import Card from '@/components/Ui/Card/Card';
import RevenueGauge from '@/components/Dashboards/RevenueGauge/RevenueGauge';
import GoalPaceCard from '@/components/Dashboards/GoalPaceCard/GoalPaceCard';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import toBRL from '@/utils/toBRL';
import Modal from '@/components/Ui/Modal/Modal';
import { useState } from 'react';
import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import OrderType from '@/components/Dashboards/OrderType/OrderType';
import Order from '@/components/Dashboards/Order/Order';
import { dataset, valueFormatter } from './weather';
import { BarChart } from '@mui/x-charts';

export default function Faturamento() {
  const [isOpen, setIsOpen] = useState(false);

  const vendor = (
    <VendorCard
      name='HUGO DOS SANTOS GONÇALVES'
      orders={100}
      meta={10}
      participation={70}
      totalValue={3000450}
      rank={1}
      onClick={() => setIsOpen(true)}
    />
  );
  const vendors = new Array(10).fill(vendor);
  const top3 = vendors.slice(0, 3);
  const otherVendors = vendors.slice(3);
  const scrollDuration = `${otherVendors.length * 1.7}s`;
  const { resolvedTheme } = useTheme();
  const chartSetting = {
    yAxis: [
      {
        label: 'valor faturado',
        width: 70,
        valueFormatter: (value: number) => {
          const mi = value / 1_000_000;
          return `${Number.isInteger(mi) ? mi : mi.toFixed(1)} MI`;
        },
      },
    ],
    series: [{ dataKey: 'faturamento', label: 'Meses anteriores', valueFormatter }],
    height: 200,
    margin: { left: 0 },
    sx:{

    }
  };


  return (
    <div className={styles.dashboardContainer}>
      <DashboardGrid>
        {/* Ranking */}
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
                className={`${vendors.length > 9 && styles.autoScroll}`}
                style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
              >
                <div className={styles.vendorGroup}>
                  {otherVendors.map((vendor) => (
                    vendor
                  ))}
                </div>
                <div className={styles.vendorGroup} aria-hidden="true">
                  {vendors.length >= 10 && (
                    otherVendors.map((vendor) => (
                      vendor
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashboardWidget>
        {/* Logo */}
        <DashboardWidget cols={2} rows={1}>
          <div className={styles.logoContainer}>
            <Image
              src={resolvedTheme === 'dark' ? '/logo.png' : '/logo_dark.png'}
              alt='Aços Vital'
              width={200}
              height={43}
            />
          </div>
        </DashboardWidget>
        {/* Ritmo de faturamento */}
        <DashboardWidget cols={5} rows={2}>
          <Card>
            <BarChart
              dataset={dataset}
              xAxis={[{ dataKey: 'mes'}]}
              {...chartSetting}
            />
          </Card>
        </DashboardWidget>
        {/* Gauge */}
        <DashboardWidget cols={2} rows={3}>
          <RevenueGauge
            value={101}
            target="40 MI"
            totalRevenue={23119350}
            lastMonthRevenue={23119350}
            lastMonthOrders={1029}
          />
        </DashboardWidget>
        {/* Ritmo de Meta */}
        <DashboardWidget cols={5} rows={1}>
          <GoalPaceCard
            status="above"
            idealDailyTarget={1136363.64}
            currentDailyTarget={399468.64}
            workingDays={22}
            elapsedDays={2}
          />
        </DashboardWidget>
        {/* Tipo de faturamento */}
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
        {/* Situação */}
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
        {/* Faturamento Diário */}
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
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title='Detalhes do vendedor'
      >
        <div className={styles.modalContent}>
          <div className={styles.VendorDetails}>
            <div className={styles.quickView}>
              <div className={styles.quickViewTitle}>
                <Avatar name={'HUGO GONÇALVES'} size={50} />
                <h3>HUGO DOS SANTOS GONÇALVES</h3>
              </div>
              <div className={styles.quickViewValues}>
                <div>
                  <h4>Valor Total</h4>
                  <h3>{toBRL(2654843.16)}</h3>
                </div>
                <div>
                  <h4>Total Pedidos</h4>
                  <h3>65</h3>
                </div>
              </div>
            </div>
            <div className={styles.ordersTypesCount}>
              <OrderType
                orderType='SPOT'
                count={4859}
                value={15269}
              />
              <OrderType
                orderType='CONTRATO'
                count={4859}
                value={15269}
              />
              <OrderType
                orderType='SEM CLASSIFICAÇÃO'
                count={4859}
                value={15269}
                cardType='double'
              />
              <OrderType
                orderType='CANCELADO'
                count={4859}
                value={15269}
              />
              <OrderType
                orderType='DEVOLVIDO'
                count={4859}
                value={15269}
              /><OrderType
                orderType='RECUSADO'
                count={4859}
                value={15269}
              />
              <OrderType
                orderType='REFATURAMENTO'
                count={4859}
                value={15269}
              />
            </div>
          </div>
          <div className={styles.allOrders}>
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
              status='CANCELADO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
              value={15210}
              category='SPOT'
              status='DEVOLVIDO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
              status='RECUSADO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
              status='REFATURAMENTO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='CONTRATO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SEM CLASSIFICAÇÃO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
              status='CANCELADO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
              status='DEVOLVIDO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
              status='RECUSADO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
              status='REFATURAMENTO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='CONTRATO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SEM CLASSIFICAÇÃO'
            />
            <Order
              id={24532}
              date='10/06/2026'
              partner='MOSAIC FERTILIZANTES P&K LTDA.'
              value={15210}
              category='SPOT'
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
