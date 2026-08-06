import { CircularProgress } from '@mui/material';
import styles from './WidgetLoading.module.css';

const WidgetLoading = () => (
  <div className={styles.container}>
    <div className={styles.loading}>
      <CircularProgress size={40} className={styles.spinner} />
      <span>Carregando...</span>
    </div>
  </div>
);

export default WidgetLoading;
