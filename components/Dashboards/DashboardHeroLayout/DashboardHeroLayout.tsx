import DashboardGrid from '../DashboardGrid/DashboardGrid';
import DashboardWidget from '../DashboardWidget/DashboardWidget';

interface DashboardHeroLayoutProps {
  /** Métrica principal (gauge, indicador central). 6 cols x 3 rows. */
  hero: React.ReactNode;
  /**
   * Estatísticas rápidas (valores do dia/ontem).
   * 3 cols x 3 rows (2 rows se `tertiary` for informado).
   */
  secondaryStats: React.ReactNode;
  /**
   * Card de ritmo/meta ou similar, ao lado das estatísticas rápidas.
   * 3 cols x 3 rows (2 rows se `tertiary` for informado).
   */
  secondaryPace: React.ReactNode;
  /** Ranking/lista, ocupando a coluna direita inteira. 6 cols x 6 rows. */
  ranking: React.ReactNode;
  /**
   * Faixa extra opcional abaixo de `secondaryStats`/`secondaryPace`,
   * ocupando as 6 colunas da metade esquerda. 6 cols x 1 row. Quando
   * presente, `secondaryStats`/`secondaryPace` encolhem de 3 para 2
   * rows para abrir espaço (soma continua fechando em 6, igual ao
   * `hero` e ao `ranking`).
   */
  tertiary?: React.ReactNode;
}

/**
 * Layout padrão para dashboards no formato "hero + ranking":
 * metade esquerda com uma métrica principal em cima e duas caixas
 * secundárias embaixo (mesma altura), metade direita com um ranking
 * de altura total. Ver components/Dashboards/DashboardHeroLayout/README.md
 * para a convenção completa de linhas/colunas.
 */
const DashboardHeroLayout = ({
  hero,
  secondaryStats,
  secondaryPace,
  ranking,
  tertiary,
}: DashboardHeroLayoutProps) => {
  const secondaryRows = tertiary ? 2 : 3;
  return (
    <DashboardGrid>
      {/* Mobile: gauge/indicador principal primeiro, depois as demais
          informações, ranking por último (ver mobileOrder de cada zona). */}
      <DashboardWidget cols={6} rows={3} tabletCols={12} mobileOrder={1}>
        {hero}
      </DashboardWidget>
      <DashboardWidget cols={6} rows={6} tabletCols={12} mobileOrder={5}>
        {ranking}
      </DashboardWidget>
      <DashboardWidget cols={3} rows={secondaryRows} tabletCols={6} mobileOrder={2}>
        {secondaryStats}
      </DashboardWidget>
      <DashboardWidget cols={3} rows={secondaryRows} tabletCols={6} mobileOrder={3}>
        {secondaryPace}
      </DashboardWidget>
      {tertiary && (
        <DashboardWidget cols={6} rows={1} tabletCols={12} mobileOrder={4}>
          {tertiary}
        </DashboardWidget>
      )}
    </DashboardGrid>
  );
};

export default DashboardHeroLayout;
