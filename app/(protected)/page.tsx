'use client';
import Card from "@/components/Ui/Card/Card";
import DashboardGrid from "@/components/Dashboards/DashboardGrid/DashboardGrid";
import styles from "./styles.module.css";
import DashboardWidget from "@/components/Dashboards/DashboardWidget/DashboardWidget";

export default function Home() {
  return (
    <div className={`${styles.dashboardContainer}`}>
      <DashboardGrid>
        <DashboardWidget cols={4} rows={4}>
          <Card>
            <p>GRAFICO 1</p>
          </Card>
        </DashboardWidget>        
        <DashboardWidget cols={5} rows={2}>
          <Card>
            <p>GRAFICO 2</p>
          </Card>
        </DashboardWidget>        
        <DashboardWidget cols={3} rows={2}>
          <Card>
            <p>GRAFICO 3</p>
          </Card>
        </DashboardWidget>  
        <DashboardWidget cols={3} rows={2}>
          <Card>
            <p>GRAFICO 3</p>
          </Card>
        </DashboardWidget>
        <DashboardWidget cols={5} rows={2}>
          <Card>
            <p>GRAFICO 2</p>
          </Card>
        </DashboardWidget>        
      </DashboardGrid>
    </div>
  );
}
