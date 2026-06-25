import styles from './PageContent.module.css';

const PageContent = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.content}>{children}</div>;
};

export default PageContent;
