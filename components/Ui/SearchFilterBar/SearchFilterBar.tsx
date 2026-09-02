'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Menu, MenuItem } from '@mui/material';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import styles from './SearchFilterBar.module.css';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: FilterDef[];
  activeValues: Record<string, string | undefined>;
  onFilterChange: (key: string, value: string | null) => void;
  glass?: boolean;
}

export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  activeValues,
  onFilterChange,
  glass = false,
}: SearchFilterBarProps) {
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const openMenu = (key: string, target: HTMLElement) => {
    setOpenFilterKey(key);
    setAnchorEl(target);
  };

  const closeMenu = () => {
    setOpenFilterKey(null);
    setAnchorEl(null);
  };

  return (
    <div className={clsx(styles.bar, glass && styles.glass)}>
      <div className={styles.searchField}>
        <span className={styles.searchIcon}>
          <FaSearch size={14} />
        </span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {filters.map((filter) => {
        const activeValue = activeValues[filter.key];
        const activeOption = filter.options.find((o) => o.value === activeValue);

        if (activeOption) {
          return (
            <span key={filter.key} className={styles.chip}>
              <span className={styles.chipLabel}>{filter.label}:</span>
              {activeOption.label}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => onFilterChange(filter.key, null)}
                aria-label={`Remover filtro de ${filter.label}`}
              >
                <FaTimes size={9} />
              </button>
            </span>
          );
        }

        return (
          <button
            key={filter.key}
            type="button"
            className={styles.filterButton}
            onClick={(e) => openMenu(filter.key, e.currentTarget)}
          >
            <FaPlus size={10} />
            {filter.label}
          </button>
        );
      })}

      <Menu anchorEl={anchorEl} open={!!openFilterKey} onClose={closeMenu}>
        {filters
          .find((f) => f.key === openFilterKey)
          ?.options.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => {
                onFilterChange(openFilterKey as string, option.value);
                closeMenu();
              }}
            >
              {option.label}
            </MenuItem>
          ))}
      </Menu>
    </div>
  );
}
