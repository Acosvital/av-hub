import { createTheme } from '@mui/material/styles';
import { componentOverrides } from './componentOverrides';

export const getMuiTheme = 
  createTheme({
    palette: {},
    typography: {},
    components: componentOverrides,
  });