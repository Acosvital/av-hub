import { CircularProgress } from '@mui/material';
import styles from './WidgetLoading.module.css';

const WidgetLoading = () => (
  <div className={styles.loading}>
    <CircularProgress size={50} />
    <span>Carregando...</span>
  </div>
);

export default WidgetLoading;
