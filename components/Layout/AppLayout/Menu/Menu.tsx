'use client';
import styles from './Menu.module.css';
import {
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsUpDown,
  LuKeyRound,
  LuLogOut,
  LuMoon,
  LuSun,
} from 'react-icons/lu';
import { Fragment, startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Collapse, Divider, ListItemIcon, Menu as MuiMenu, MenuItem as MuiMenuItem, Tooltip } from '@mui/material';
import type { MenuItem } from './MenuItem/MenuItem';
import iconMap from './MenuItem/iconMap';
import groupMap from './MenuItem/groupMap';
import Image from 'next/image';
import Avatar from '../Header/Avatar/Avatar';
import AlterarSenhaModal from '../Header/AlterarSenhaModal';
import useLayout from '@/hooks/useLayout';
import { usePathname } from 'next/navigation';

// Estilo dos itens do dropdown de perfil, alinhado ao visual do sidebar
// (mesma fonte/peso dos itens de navegação e mesmo hover neutro).
const menuItemSx = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--fs-sm)',
  fontWeight: 'var(--w-semibold)',
  color: 'var(--navy-100)',
  borderRadius: 'var(--radius-md)',
  py: 1,
  px: 1.5,
  '&:hover': {
    backgroundColor: 'color-mix(in srgb, var(--neutral-50) 8%, transparent)',
    color: 'var(--neutral-50)',
  },
};

const logoutMenuItemSx = {
  color: 'var(--danger)',
  '&:hover': {
    backgroundColor: 'color-mix(in srgb, var(--danger) 18%, transparent)',
    color: 'var(--danger)',
  },
};

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
  pathname: string;
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
  pathname,
}: MenuNodeProps) => {
  const isExpanded = expandedItems.has(path);
  const hasChildren = !!item.submenu?.length;

  if (depth === 0) {
    const isActive = pathname.startsWith(`/${item.id}`);

    if (!hasChildren) {
      return (
        <Tooltip title={isMinimized ? item.label : ''} placement="right" arrow>
          <li className={styles.menuWrapper}>
            <Link href={`/${item.id}`} className={styles.link}>
              <div className={`${styles.menuCard} ${isActive ? styles.selectedMenu : ''}`}>
                <span className={styles.menuIcon}>
                  {iconMap[item.id as keyof typeof iconMap]}
                </span>
                <span className={`${styles.menuLabel} ${isMinimized ? styles.hidden : ''}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          </li>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={isMinimized ? item.label : ''} placement="right" arrow>
        <li className={styles.menuWrapper}>
          <div
            className={`${styles.menuCard} ${isActive ? styles.selectedMenu : ''}`}
            onClick={() => {
              if (isMinimized) setIsMinimized(false);
              onRootExpand(path);
            }}
          >
            <span className={styles.menuIcon}>{iconMap[item.id as keyof typeof iconMap]}</span>
            <span className={`${styles.menuLabel} ${isMinimized ? styles.hidden : ''}`}>
              {item.label}
            </span>
            <LuChevronDown
              className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''} ${isMinimized ? styles.hidden : ''}`}
            />
          </div>
          <Collapse in={isExpanded && !isMinimized} timeout="auto" unmountOnExit>
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
                  pathname={pathname}
                />
              ))}
            </ul>
          </Collapse>
        </li>
      </Tooltip>
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
          <LuChevronDown className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`} />
        </div>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
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
                pathname={pathname}
              />
            ))}
          </ul>
        </Collapse>
      </li>
    );
  }

  return (
    <Link href={`/${path}`} className={styles.link}>
      <li className={`${cssItem} ${pathname === `/${path}` ? styles.submenuItemSelected : ''}`}>
        {item.label}
      </li>
    </Link>
  );
};

const Menu = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [isAlterarSenhaOpen, setIsAlterarSenhaOpen] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout();
  const pathname = usePathname();

  useEffect(() => {
    startTransition(() => setThemeMounted(true));
  }, []);

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

  // Auto-expande o item de nível 0 correspondente à rota atual, para o
  // submenu já aparecer aberto quando o usuário chega numa página dele.
  // `menuData` só fica disponível depois do fetch a `/api/menu`, e a
  // rota muda por navegação externa (next/navigation) — não há como
  // derivar isso puramente no render, por isso o efeito.
  useEffect(() => {
    const active = menuData.find((item) => pathname.startsWith(`/${item.id}`));
    if (!active?.submenu?.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o submenu aberto com a rota atual (fonte externa), não com props/estado do próprio componente
    setExpandedItems((prev) => (prev.has(active.id) ? prev : new Set([active.id])));
  }, [menuData, pathname]);

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

  const userName = session?.user?.name ?? session?.user?.email ?? '';
  const idUsuario = session?.user?.id_usuario ?? '';
  const isCredentials = session?.user?.authProvider === 'credentials';
  const isDark = theme === 'dark';

  const handleLogout = async () => {
    await signOut({
      callbackUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
    });
  };

  // Agrupa os itens por seção (mantendo a ordem de primeira aparição
  // de cada grupo), já que a API pode intercalar itens de grupos
  // diferentes e cada rótulo de seção só deve aparecer uma vez.
  const ungrouped = menuData.filter((item) => !groupMap[item.id]);
  const groupOrder: string[] = [];
  menuData.forEach((item) => {
    const group = groupMap[item.id];
    if (group && !groupOrder.includes(group)) groupOrder.push(group);
  });
  const sections = groupOrder.map((group) => ({
    group,
    items: menuData.filter((item) => groupMap[item.id] === group),
  }));

  return (
    <>
      {mobileMenuOpen && (
        <div className={styles.backdrop} onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside
        className={`${effectiveMinimized ? styles.minimized : styles.expanded} ${mobileMenuOpen ? styles.mobileOpen : ''}`}
      >
        <button
          className={styles.toggleBtn}
          onClick={() => {
            setIsMinimized(!isMinimized);
            setMobileMenuOpen(false);
          }}
          aria-label={effectiveMinimized ? 'Expandir menu' : 'Minimizar menu'}
        >
          {effectiveMinimized ? <LuChevronRight size={14} /> : <LuChevronLeft size={14} />}
        </button>
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
        </div>
        <ul className={styles.menuContainer}>
          {ungrouped.map((item: MenuItem) => (
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
              pathname={pathname}
            />
          ))}
          {sections.map(({ group, items }) => (
            <Fragment key={group}>
              {!effectiveMinimized && <li className={styles.groupLabel}>{group}</li>}
              {items.map((item) => (
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
                  pathname={pathname}
                />
              ))}
            </Fragment>
          ))}
        </ul>
        {status === 'authenticated' && (
          <div className={styles.footer}>
            <Tooltip title={effectiveMinimized ? userName : ''} placement="right" arrow>
              <button
                className={`${styles.profileTrigger} ${profileAnchor ? styles.profileTriggerOpen : ''}`}
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                aria-haspopup="true"
                aria-expanded={!!profileAnchor}
              >
                <Avatar name={userName} size={36} />
                <div
                  className={`${styles.profileInfo} ${effectiveMinimized ? styles.hidden : ''}`}
                >
                  <span className={styles.profileName}>{userName}</span>
                  <span className={styles.profileEmail}>{session?.user?.email}</span>
                </div>
                <LuChevronsUpDown
                  size={16}
                  className={`${styles.profileChevron} ${profileAnchor ? styles.rotated : ''} ${effectiveMinimized ? styles.hidden : ''}`}
                />
              </button>
            </Tooltip>
            <MuiMenu
              anchorEl={profileAnchor}
              open={!!profileAnchor}
              onClose={() => setProfileAnchor(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              marginThreshold={0}
              slotProps={{
                paper: {
                  sx: {
                    width: 'calc(var(--menu-w) - var(--space-4))',
                    bgcolor: 'var(--navy-850)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    mb: 1,
                  },
                },
                list: {
                  sx: { py: 0.75, px: 0.75 },
                },
              }}
            >
              {themeMounted && (
                <MuiMenuItem
                  onClick={() => {
                    setTheme(isDark ? 'light' : 'dark');
                    setProfileAnchor(null);
                  }}
                  sx={menuItemSx}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
                    {isDark ? <LuSun size={18} /> : <LuMoon size={18} />}
                  </ListItemIcon>
                  {isDark ? 'Tema claro' : 'Tema escuro'}
                </MuiMenuItem>
              )}
              {isCredentials && idUsuario && (
                <MuiMenuItem
                  onClick={() => {
                    setIsAlterarSenhaOpen(true);
                    setProfileAnchor(null);
                  }}
                  sx={menuItemSx}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
                    <LuKeyRound size={18} />
                  </ListItemIcon>
                  Alterar senha
                </MuiMenuItem>
              )}
              <Divider sx={{ borderColor: 'var(--border)', my: 0.5, mx: 1 }} />
              <MuiMenuItem
                onClick={() => {
                  setProfileAnchor(null);
                  handleLogout();
                }}
                sx={{ ...menuItemSx, ...logoutMenuItemSx }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
                  <LuLogOut size={18} />
                </ListItemIcon>
                Sair
              </MuiMenuItem>
            </MuiMenu>
          </div>
        )}
      </aside>
      {idUsuario && (
        <AlterarSenhaModal
          isOpen={isAlterarSenhaOpen}
          onClose={() => setIsAlterarSenhaOpen(false)}
          idUsuario={idUsuario}
        />
      )}
    </>
  );
};

export default Menu;
