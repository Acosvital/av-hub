import CardHeader from '../CardHeader/CardHeader';
import styles from './SectionCard.module.css';

interface SectionCardHeader {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

interface SectionCardProps {
  header?: SectionCardHeader;
  children: React.ReactNode;
  /**
   * Sobrescreve o fundo padrão (`var(--card-bg)`) quando informado.
   * Redefine a própria variável `--card-bg` neste card, então a barra
   * de cabeçalho (que deriva sua cor a partir dela) acompanha junto.
   */
  background?: string;
}

/**
 * Card genérico de dashboard: fundo, cantos arredondados e (quando
 * `header` é informado) uma barra de cabeçalho destacada, colada nas
 * bordas do card. O conteúdo (`children`) recebe o padding padrão.
 * Substitui os antigos `.defaultCard` locais de cada página de
 * dashboard.
 */
const SectionCard = ({ header, children, background }: SectionCardProps) => {
  return (
    <div
      className={styles.sectionCard}
      style={background ? ({ '--card-bg': background } as React.CSSProperties) : undefined}
    >
      {header && <CardHeader {...header} />}
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default SectionCard;
