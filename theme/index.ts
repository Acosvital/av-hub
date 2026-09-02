import { createTheme } from '@mui/material/styles';
import { componentOverrides } from './componentOverrides';

// mode só ajusta os defaults internos do MUI (contraste, elevation overlay,
// etc.) que não passam pelas CSS custom properties em componentOverrides —
// as cores visíveis continuam vindo dos tokens de styles/variables.css.
export const getMuiTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: { mode },
    typography: {},
    components: componentOverrides,
  });
