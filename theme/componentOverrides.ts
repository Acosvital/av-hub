import { Theme } from "@mui/material/styles";
import { Components } from "@mui/material/styles";

export const componentOverrides: Components<Theme> = {
  MuiButton: {},
  MuiTextField: {},
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        backgroundColor: 'var(--input-bg)',
        color: 'var(--foreground)',
        borderRadius: 'var(--radius-lg)',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'var(--input-border)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'var(--border-strong)',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: 'var(--border-strong)',
          borderWidth: '2px',
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: 'var(--input-label)',
        fontFamily: 'var(--font-sans)',
        '&.Mui-focused': {
          color: 'var(--foreground)',
          backgroundColor: 'var(--card-bg)',
        },
      },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: {
        color: 'var(--foreground)',
        backgroundColor: 'var(--table-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-strong)',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: 'background-color 0.15s ease',
        '&.MuiTableRow-hover:hover': {
          backgroundColor: 'var(--table-row-hover)',
        },
        cursor: 'pointer'
      },
      head: {
        cursor: 'default',
        '&:hover': {
          backgroundColor: 'transparent',
        },
      },
    }
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        backgroundColor: 'var(--table-head-bg)',
        color: 'var(--table-head-fg)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--w-bold)',
        fontSize: 'var(--fs-sm)',
        letterSpacing: '0.02em',
        borderBottom: '1px solid var(--border-strong)',
        padding: '0 var(--space-4)',
      },
      body: {
        borderColor: 'var(--border)',
        fontFamily: 'var(--font-mono)',
        color: 'var(--table-row-fg)',
        fontSize: 'var(--fs-xs)',
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: {
        color: 'var(--table-head-fg)',
        fontWeight: 'var(--w-bold)',
        fontSize: 'var(--fs-sm)',
      },
    },
  }
}