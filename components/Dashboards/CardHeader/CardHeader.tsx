import styles from './CardHeader.module.css';

interface CardHeaderProps {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

/**
 * Cabeçalho padrão para os cards de um dashboard: ícone/indicador +
 * título + slot opcional à direita (pill de status, contador, etc.).
 */
const CardHeader = ({ title, icon, right }: CardHeaderProps) => {
  return (
    <div className={styles.cardHeader}>
      <h4 className={`${styles.title} sectionLabel`}>
        {icon}
        {title}
      </h4>
      {right}
    </div>
  );
};

export default CardHeader;
