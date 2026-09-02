'use client';
import styles from './Menu.module.css';
import {
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsUpDown,
  LuClock,
  LuKeyRound,
  LuLogOut,
  LuMoon,
  LuRefreshCw,
  LuSearch,
  LuSun,
  LuX,
} from 'react-icons/lu';
import { Fragment, startTransition, useEffect, useMemo, useRef, useState } from 'react';
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
import { usePathname, useRouter } from 'next/navigation';
import { notify } from '@/lib/toast/toast';

const RECENTS_KEY = 'hub:recentPages';
const COLLAPSED_GROUPS_KEY = 'hub:collapsedGroups';
const MAX_RECENTS = 4;
// Mesma duração do @keyframes menuSpin em Menu.module.css — uma volta cheia.
const SPIN_DURATION_MS = 800;

interface FlatMenuItem {
  path: string;
  label: string;
  breadcrumb: string;
  rootId: string;
  hasChildren: boolean;
}

// Lista plana de todo o menu (todos os níveis), usada pela busca e pelos
// "recentes" — só itens folha (hasChildren=false) têm uma página de
// verdade para navegar até.
function flattenMenu(
  items: MenuItem[],
  prefix = '',
  trail: string[] = [],
  rootId = ''
): FlatMenuItem[] {
  let out: FlatMenuItem[] = [];
  for (const item of items) {
    const path = prefix ? `${prefix}/${item.id}` : item.id;
    const currentRoot = rootId || item.id;
    const hasChildren = !!item.submenu?.length;
    out.push({ path, label: item.label, breadcrumb: trail.join(' › '), rootId: currentRoot, hasChildren });
    if (hasChildren) {
      out = out.concat(flattenMenu(item.submenu!, path, [...trail, item.label], currentRoot));
    }
  }
  return out;
}

// Remove acentos pra busca funcionar digitando "orcamento" ou "usuarios"
// sem cedilha/til. Evita depender de regex com marcas de combinação
// literais no código-fonte (frágeis de editar/versionar corretamente).
function normalizeSearch(value: string): string {
  const decomposed = value.toLowerCase().normalize('NFD');
  let out = '';
  for (let i = 0; i < decomposed.length; i++) {
    const code = decomposed.charCodeAt(i);
    if (code < 768 || code > 879) out += decomposed[i];
  }
  return out;
}

// Cadeia de ids (com submenu) que leva até a rota atual, ex.:
// ['cadastros', 'cadastros/auxiliares'] para /cadastros/auxiliares/unidades.
// Usado para auto-expandir e destacar o caminho ativo em todos os níveis,
// não só na raiz.
function findActiveChain(items: MenuItem[], pathname: string, prefix = ''): string[] {
  for (const item of items) {
    const path = prefix ? `${prefix}/${item.id}` : item.id;
    if (item.submenu?.length) {
      if (pathname === `/${path}` || pathname.startsWith(`/${path}/`)) {
        return [path, ...findActiveChain(item.submenu, pathname, path)];
      }
    } else if (pathname === `/${path}`) {
      return [];
    }
  }
  return [];
}

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
  const isOnActivePath = pathname === `/${path}` || pathname.startsWith(`/${path}/`);

  if (hasChildren) {
    return (
      <li>
        <div
          className={`${cssItem} ${styles.submenuItemExpandable} ${isOnActivePath ? styles.submenuItemOnPath : ''}`}
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
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const { data: session, status, update } = useSession();
  const { theme, setTheme } = useTheme();
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout();
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startTransition(() => setThemeMounted(true));
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  const effectiveMinimized = isMinimized && !mobileMenuOpen;

  const loadMenu = () => {
    fetch('/api/menu')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setMenuData)
      .catch(() => setMenuData([]));
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    loadMenu();
  }, [status]);

  // Resincroniza a sessão (menu/permissões, nome, avatar) sem exigir logout
  // — útil quando um admin acabou de liberar acesso a uma tela nova e o
  // usuário não quer esperar a sessão expirar pra ela aparecer.
  const handleSync = async () => {
    // `update()` costuma resolver quase instantaneamente em dev — sem esse
    // piso o ícone mal começa a girar e já é interrompido no meio da volta,
    // dando um "solavanco" que parece bug em vez de um spinner de carregando.
    // Uma volta completa (SPIN_DURATION_MS) garante que ele sempre pare no
    // mesmo ângulo de repouso.
    const giroCompleto = new Promise((resolve) => setTimeout(resolve, SPIN_DURATION_MS));
    try {
      setIsSyncing(true);
      await Promise.all([update(), giroCompleto]);
      loadMenu();
      notify.success('Sincronizado');
    } catch (err) {
      console.error(err);
      await giroCompleto;
      notify.error('Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
      setProfileAnchor(null);
    }
  };

  // Auto-expande toda a cadeia de grupos até a rota atual (não só a raiz),
  // pra abrir "Cadastros > Auxiliares" sozinho ao entrar direto em
  // /cadastros/auxiliares/unidades. `menuData` só fica disponível depois
  // do fetch a `/api/menu`, e a rota muda por navegação externa
  // (next/navigation) — não há como derivar isso puramente no render.
  useEffect(() => {
    const chain = findActiveChain(menuData, pathname);
    if (!chain.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o submenu aberto com a rota atual (fonte externa), não com props/estado do próprio componente
    setExpandedItems(new Set(chain));
  }, [menuData, pathname]);

  const flatList = useMemo(() => flattenMenu(menuData), [menuData]);

  // Carrega recentes e seções recolhidas do localStorage uma vez, no
  // cliente (evita mismatch de hidratação — no primeiro render do
  // servidor essas preferências ainda não existem).
  useEffect(() => {
    try {
      const rawRecents = localStorage.getItem(RECENTS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrata estado a partir do localStorage (fonte externa), só pode ser lido depois de montar no cliente
      if (rawRecents) setRecents(JSON.parse(rawRecents));
      const rawCollapsed = localStorage.getItem(COLLAPSED_GROUPS_KEY);
      if (rawCollapsed) setCollapsedGroups(new Set(JSON.parse(rawCollapsed)));
    } catch {
      // preferências são só conveniência — se der erro, segue sem elas
    }
  }, []);

  // Registra a página atual como "recente" assim que ela é reconhecida
  // como um item folha do menu.
  useEffect(() => {
    if (!flatList.length) return;
    const current = pathname.replace(/^\//, '');
    const match = flatList.find((item) => !item.hasChildren && item.path === current);
    if (!match) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com a rota atual (fonte externa) e persiste no localStorage
    setRecents((prev) => {
      if (prev[0] === match.path) return prev;
      const next = [match.path, ...prev.filter((p) => p !== match.path)].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        // idem — best effort
      }
      return next;
    });
  }, [pathname, flatList]);

  // Nunca deixa a seção que contém a página atual escondida.
  useEffect(() => {
    const activeRoot = menuData.find((item) => pathname.startsWith(`/${item.id}`));
    const group = activeRoot ? groupMap[activeRoot.id] : undefined;
    if (!group) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com a rota atual (fonte externa)
    setCollapsedGroups((prev) => {
      if (!prev.has(group)) return prev;
      const next = new Set(prev);
      next.delete(group);
      try {
        localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify([...next]));
      } catch {
        // idem
      }
      return next;
    });
  }, [pathname, menuData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- limpa a busca ao navegar (fonte externa: mudança de rota)
    setQuery('');
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (effectiveMinimized) setIsMinimized(false);
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [effectiveMinimized]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      try {
        localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify([...next]));
      } catch {
        // idem
      }
      return next;
    });
  };

  const normalizedQuery = normalizeSearch(query.trim());
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return flatList
      .filter((item) => !item.hasChildren)
      .filter((item) => normalizeSearch(`${item.breadcrumb} ${item.label}`).includes(normalizedQuery))
      .slice(0, 8);
  }, [flatList, normalizedQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      searchInputRef.current?.blur();
    } else if (e.key === 'Enter' && searchResults.length) {
      router.push(`/${searchResults[0].path}`);
      setQuery('');
      searchInputRef.current?.blur();
    }
  };

  const highlightMatch = (label: string) => {
    const idx = normalizeSearch(label).indexOf(normalizedQuery);
    if (idx === -1 || !normalizedQuery) return label;
    return (
      <>
        {label.slice(0, idx)}
        <mark className={styles.searchMark}>{label.slice(idx, idx + query.trim().length)}</mark>
        {label.slice(idx + query.trim().length)}
      </>
    );
  };

  const recentChips = recents
    .filter((path) => `/${path}` !== pathname)
    .map((path) => flatList.find((item) => item.path === path))
    .filter((item): item is FlatMenuItem => !!item);

  const removeRecent = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRecents((prev) => {
      const next = prev.filter((p) => p !== path);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        // preferência é só conveniência — se der erro, segue sem persistir
      }
      return next;
    });
  };

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
              height={34}
              width={156}
              className={effectiveMinimized ? styles.hidden : styles.logoImg}
            />
          </Link>
        </div>
        {!effectiveMinimized && (
          <div className={styles.searchWrap}>
            <div className={styles.searchBox}>
              <LuSearch size={14} className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Buscar página..."
                aria-label="Buscar página"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {!query && <span className={styles.kbdHint}>Ctrl K</span>}
            </div>
            {!query && !!recentChips.length && (
              <div className={styles.recentsRow}>
                {recentChips.map((item) => (
                  <Link key={item.path} href={`/${item.path}`} className={styles.recentChip}>
                    <LuClock size={11} />
                    {item.label}
                    <button
                      type="button"
                      className={styles.recentChipRemove}
                      onClick={(e) => removeRecent(item.path, e)}
                      aria-label={`Remover ${item.label} dos recentes`}
                    >
                      <LuX size={10} />
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <ul className={styles.menuContainer}>
          {query.trim() ? (
            searchResults.length ? (
              searchResults.map((item) => (
                <li key={item.path} className={styles.searchResultWrapper}>
                  <Link href={`/${item.path}`} className={styles.link}>
                    <div className={styles.searchResultItem}>
                      <span className={styles.menuIcon}>
                        {iconMap[item.rootId as keyof typeof iconMap]}
                      </span>
                      <span className={styles.searchResultText}>
                        <span className={styles.menuLabel}>{highlightMatch(item.label)}</span>
                        {!!item.breadcrumb && (
                          <span className={styles.searchResultBreadcrumb}>{item.breadcrumb}</span>
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className={styles.searchEmpty}>Nada encontrado para &quot;{query}&quot;</li>
            )
          ) : (
            <>
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
              {sections.map(({ group, items }) => {
                const collapsed = collapsedGroups.has(group);
                return (
                  <Fragment key={group}>
                    {!effectiveMinimized && (
                      <li className={styles.groupLabelItem}>
                        <button
                          type="button"
                          className={styles.groupLabel}
                          onClick={() => toggleGroup(group)}
                          aria-expanded={!collapsed}
                        >
                          <span>{group}</span>
                          <LuChevronDown
                            className={`${styles.groupChevron} ${collapsed ? '' : styles.rotated}`}
                          />
                        </button>
                      </li>
                    )}
                    {(!collapsed || effectiveMinimized) &&
                      items.map((item) => (
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
                );
              })}
            </>
          )}
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
              <MuiMenuItem onClick={handleSync} disabled={isSyncing} sx={menuItemSx}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
                  <LuRefreshCw size={18} className={isSyncing ? styles.spinning : ''} />
                </ListItemIcon>
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </MuiMenuItem>
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
