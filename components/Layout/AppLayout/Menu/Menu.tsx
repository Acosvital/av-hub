"use client"
import styles from "./Menu.module.css";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdExpandMore } from "react-icons/md";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import menuItems, { MenuItem } from "./MenuItem/MenuItem";
import iconMap from "./MenuItem/iconMap";
import Image from "next/image";

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
  // Se depth === 0, significa que é raiz do menu, ou seja: possui ícone
  if (depth === 0) {
    return (
      <li className={styles.menuWrapper}>
        <div
          className={`${styles.menuCard} ${isExpanded ? styles.selectedMenu : ""}`}
          onClick={() => {
            if (isMinimized) setIsMinimized(false);
            if (hasChildren) onRootExpand(path);
          }}
        >
          {iconMap[item.id as keyof typeof iconMap]}
          <span className={isMinimized ? styles.hidden : ""}>{item.label}</span>
          {hasChildren && (
            <MdExpandMore
              className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ""} ${isMinimized ? styles.hidden : ""}`}
            />
          )}
        </div>
        {/* chama o MenuNode recursivamente, mudando o depth e incrementando o path */}
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

  {/* se possui filho, adiciona o icone de expand*/ }
  if (hasChildren) {
    return (
      <li>
        <div
          className={`${cssItem} ${styles.submenuItemExpandable} ${isExpanded ? styles.submenuItemSelected : ""}`}
          onClick={() => toggleItem(path)}
        >
          {item.label}
          <MdExpandMore
            className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ""}`}
          />
        </div>
        {/* chama o MenuNode recursivamente, mudando o depth e incrementando o path */}
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
  // Condição de parada da recursão: chegar no Link --> depht !== 0 e !hasChildren
  return (
    <Link href={`/${path}`} className={styles.link}>
      <li className={cssItem}>{item.label}</li>
    </Link>
  );
};

const Menu = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { data: sessionData, status } = useSession();
  const menuRole = status === 'loading'
    ? []
    : menuItems[(sessionData?.user?.role as keyof typeof menuItems) || 'vendedor'];


  // função de expansão do menu quando é "raiz - primeiro nivel"
  const onRootExpand = (key: string) => {
    setExpandedItems((prev) => {
      if (prev.has(key)) {
        return new Set([...prev].filter(k => k !== key && !k.startsWith(`${key}/`)));
      }
      return new Set([key]);
    });
  };
  // função de expansão do menu para os demais niveis
  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      if (prev.has(key)) {
        return new Set([...prev].filter(k => k !== key && !k.startsWith(`${key}/`)));
      }
      return new Set([...prev, key]);
    });
  };

  return (
    <aside className={isMinimized ? styles.minimized : styles.expanded}>
      <div className={styles.logo}>
        <Link href="/" className={styles.link}>
          <Image  src="/logo.png" alt="Aços Vital" height={30} width={138} className={isMinimized ? styles.hidden : styles.logoImg} />
        </Link>
        <GiHamburgerMenu
          className={styles.hamburger}
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Expandir" : "Minimizar"}
        />
      </div>
      <ul className={styles.menuContainer}>
        {menuRole.map((item) => (
          <MenuNode
            key={item.id}
            item={item}
            depth={0}
            path={item.id}
            isMinimized={isMinimized}
            setIsMinimized={setIsMinimized}
            expandedItems={expandedItems}
            toggleItem={toggleItem}
            onRootExpand={onRootExpand}
          />
        ))}
      </ul>
    </aside>
  );
};

export default Menu;
