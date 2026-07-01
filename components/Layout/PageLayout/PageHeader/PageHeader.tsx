import styles from './PageHeader.module.css';
interface PageHeadProps {
  title: string;
  subtitle: string;
}
const PageHeader = ({ title, subtitle }: PageHeadProps) => {
  return (
    <div>
      <h2 className={styles.title}>{title}</h2>
      <h3 className={styles.subtitle}>{subtitle}</h3>
    </div>
  );
};

export default PageHeader;
