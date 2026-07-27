import { CircularProgress } from '@mui/material';

export default function Loading() {
  return (
    <div>
      <CircularProgress size={50} />
      <span>Carregando...</span>
    </div>
  );
}
