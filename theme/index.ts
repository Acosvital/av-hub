import { createTheme } from '@mui/material/styles';
import { componentOverrides } from './componentOverrides';

// mode só ajusta os defaults internos do MUI (contraste, elevation overlay,
// etc.) que não passam pelas CSS custom properties em componentOverrides —
// as cores visíveis continuam vindo dos tokens de styles/variables.css.
export const getMuiTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: { mode },
    // `typography.fontFamily` alimenta o reset global do <CssBaseline/> em
    // `body` — vazio aqui significava herdar o default do MUI (Roboto),
    // que "ganhava" do `body { font-family: var(--font-sans) }` de
    // styles/globals.css (mesma especificidade, injetado depois). Os
    // componentes MUI individuais já tinham `fontFamily: 'var(--font-sans)'`
    // (ver componentOverrides.ts) — só a base do tema ficou de fora.
    typography: { fontFamily: 'var(--font-sans)' },
    components: componentOverrides,
  });
