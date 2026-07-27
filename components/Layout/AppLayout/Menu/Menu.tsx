'use client';
import styles from './Menu.module.css';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdExpandMore } from 'react-icons/md';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { MenuItem } from './MenuItem/MenuItem';
import iconMap from './MenuItem/iconMap';
import Image from 'next/image';
import useLayout from '@/hooks/useLayout';
import { usePathname } from 'next/navigation';

const containerClass: Partial<Record<number, string>> = {
  1: styles.submenu,
  2: styles.subsubmenu,
};

const itemClass: Partial<Record<number, string>> = {
  1: styles.submenuItem,
  2: styles.subsubmenuItem,
};

interface MenuNodeProps {
  item: MenuItem;
  depth: number;
  path: string;
  isMinimized: boolean;
  setIsMinimized: (v: boolean) => void;
  expandedItems: Set<string>;
  toggleItem: (key: string) => void;
  onRootExpand: (key: string) => void;
}

const MenuNode = ({
  item,
  depth,
  path,
  isMinimized,
  setIsMinimized,
  expandedItems,
  toggleItem,
  onRootExpand,
}: MenuNodeProps) => {
  const isExpanded = expandedItems.has(path);
  const hasChildren = !!item.submenu?.length;

  if (depth === 0) {
    return (
      <li className={styles.menuWrapper}>
        <div
          className={`${styles.menuCard} ${isExpanded ? styles.selectedMenu : ''}`}
          onClick={() => {
            if (isMinimized) setIsMinimized(false);
            if (hasChildren) onRootExpand(path);
          }}
        >
          {iconMap[item.id as keyof typeof iconMap]}
          <span className={isMinimized ? styles.hidden : ''}>{item.label}</span>
          {hasChildren && (
            <MdExpandMore
              className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''} ${isMinimized ? styles.hidden : ''}`}
            />
          )}
        </div>
        {hasChildren && isExpanded && !isMinimized && (
          <ul className={styles.submenu}>
            {item.submenu!.map((child) => (
              <MenuNode
                key={child.id}
                item={child}
                depth={1}
                path={`${path}/${child.id}`}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
                expandedItems={expandedItems}
                toggleItem={toggleItem}
                onRootExpand={onRootExpand}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const cssItem = itemClass[depth] ?? styles.subsubmenuItem;
  const cssContainer = containerClass[depth + 1] ?? styles.subsubmenu;

  if (hasChildren) {
    return (
      <li>
        <div
          className={`${cssItem} ${styles.submenuItemExpandable} ${isExpanded ? styles.submenuItemSelected : ''}`}
          onClick={() => toggleItem(path)}
        >
          {item.label}
          <MdExpandMore className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`} />
        </div>
        {isExpanded && (
          <ul className={cssContainer}>
            {item.submenu!.map((child) => (
              <MenuNode
                key={child.id}
                item={child}
                depth={depth + 1}
                path={`${path}/${child.id}`}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
                expandedItems={expandedItems}
                toggleItem={toggleItem}
                onRootExpand={onRootExpand}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <Link href={`/${path}`} className={styles.link}>
      <li className={cssItem}>{item.label}</li>
    </Link>
  );
};

const Menu = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const { status } = useSession();
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout();
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  const effectiveMinimized = isMinimized && !mobileMenuOpen;

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetch('/api/menu')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setMenuData)
      .catch(() => setMenuData([]));
  }, [status]);

  const onRootExpand = (key: string) => {
    setExpandedItems((prev) => {
      if (prev.has(key)) {
        return new Set([...prev].filter((k) => k !== key && !k.startsWith(`${key}/`)));
      }
      return new Set([key]);
    });
  };

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      if (prev.has(key)) {
        return new Set([...prev].filter((k) => k !== key && !k.startsWith(`${key}/`)));
      }
      return new Set([...prev, key]);
    });
  };

  return (
    <>
      {mobileMenuOpen && (
        <div className={styles.backdrop} onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside
        className={`${effectiveMinimized ? styles.minimized : styles.expanded} ${mobileMenuOpen ? styles.mobileOpen : ''}`}
      >
        <div className={styles.logo}>
          <Link href="/" className={styles.link}>
            <Image
              src="/logo.png"
              alt="Aços Vital"
              height={30}
              width={138}
              className={effectiveMinimized ? styles.hidden : styles.logoImg}
            />
          </Link>
          <GiHamburgerMenu
            className={styles.hamburger}
            onClick={() => {
              setIsMinimized(!isMinimized);
              setMobileMenuOpen(false);
            }}
            title={effectiveMinimized ? 'Expandir' : 'Minimizar'}
          />
        </div>
        <ul className={styles.menuContainer}>
          {menuData.map((item: MenuItem) => (
            <MenuNode
              key={item.id}
              item={item}
              depth={0}
              path={item.id}
              isMinimized={effectiveMinimized}
              setIsMinimized={setIsMinimized}
              expandedItems={expandedItems}
              toggleItem={toggleItem}
              onRootExpand={onRootExpand}
            />
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Menu;
