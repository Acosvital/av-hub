import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';

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
        '&.Mui-disabled': {
          backgroundColor: 'var(--input-bg-disabled)',
          cursor: 'not-allowed',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--input-border-disabled)',
          },
          '& .MuiOutlinedInput-input': {
            color: 'var(--input-text-disabled)',
            WebkitTextFillColor: 'var(--input-text-disabled)',
          },
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
        '&.Mui-disabled': {
          color: 'var(--input-label-disabled)',
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
        cursor: 'pointer',
      },
      head: {
        cursor: 'default',
        '&:hover': {
          backgroundColor: 'transparent',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        backgroundColor: 'var(--table-head-bg)',
        color: 'var(--table-head-fg)',
        fontFamily: 'var(--font-mono)',
        fontWeight: 'var(--w-bold)',
        fontSize: 'var(--fs-sm)',
        letterSpacing: '0.02em',
        borderBottom: '1px solid var(--border-strong)',
        padding: '0 var(--space-4)',
      },
      body: {
        borderColor: 'var(--border)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--table-row-fg)',
        fontSize: 'var(--fs-xs)',
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: {
        color: 'var(--foreground-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-sm)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--card-bg-secondary)',
      },
      toolbar: {
        minHeight: 52,
        paddingLeft: 'var(--space-3)',
        paddingRight: 'var(--space-2)',
      },
      selectLabel: {
        color: 'var(--foreground-secondary)',
        fontSize: 'var(--fs-sm)',
      },
      displayedRows: {
        color: 'var(--foreground)',
        fontWeight: 'var(--w-semibold)',
        fontSize: 'var(--fs-sm)',
      },
      select: {
        color: 'var(--foreground)',
      },
      selectIcon: {
        color: 'var(--foreground-secondary)',
      },
      actions: {
        marginLeft: 'var(--space-3)',
        color: 'var(--foreground)',
        '& .MuiIconButton-root': {
          color: 'var(--foreground)',
          borderRadius: 'var(--radius-md)',
          transition: 'background-color 0.15s ease',
        },
        '& .MuiIconButton-root:hover': {
          backgroundColor: 'color-mix(in srgb, var(--neutral-50) 10%, transparent)',
        },
        '& .MuiIconButton-root.Mui-disabled': {
          color: 'var(--foreground-secondary)',
          opacity: 0.35,
        },
      },
    },
  },
  MuiAutocomplete: {
    styleOverrides: {
      popupIndicator: {
        color: 'var(--foreground-secondary)',
        '&:hover': {
          color: 'var(--foreground)',
          backgroundColor: 'color-mix(in srgb, var(--neutral-50) 10%, transparent)',
        },
      },
      clearIndicator: {
        color: 'var(--foreground-secondary)',
        '&:hover': {
          color: 'var(--foreground)',
          backgroundColor: 'color-mix(in srgb, var(--neutral-50) 10%, transparent)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontFamily: 'var(--font-sans)',
      },
      outlined: {
        color: 'var(--foreground)',
        borderColor: 'var(--border-strong)',
        backgroundColor: 'var(--card-bg-secondary)',
      },
      deleteIcon: {
        color: 'var(--foreground-secondary)',
        '&:hover': {
          color: 'var(--foreground)',
        },
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        color: 'var(--foreground)',
        fontFamily: 'var(--font-sans)',
        '&.Mui-disabled': {
          color: 'var(--input-label-disabled)',
        },
      },
    },
  },
};
