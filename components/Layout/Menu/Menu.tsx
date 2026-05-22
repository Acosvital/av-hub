"use client"
import styles from "./Menu.module.css";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdExpandMore } from "react-icons/md";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import menuItems from "./MenuItem/MenuItem";
import iconMap from "./MenuItem/iconMap";

const Menu = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const session = useSession();
  const menuRole = menuItems[session.data?.user.role || 'vendedor'];

  const handleMenuItemClick = (menuId: string) => {    
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };
  return (
    <aside className={isMinimized ? styles.minimized : styles.expanded}>
      <div className={styles.logo}>
        <Link href="/" className={styles.link}>
          <img src="./logo.png" alt="Aços Vital" className={isMinimized ? styles.hidden : styles.logoImg} />
        </Link>
        <GiHamburgerMenu
          className={styles.hamburger}
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Expandir" : "Minimizar"}
        />
      </div>
      <ul className={styles.menuContainer}>
        {menuRole.map((item) => (
          <li key={item.id} className={styles.menuWrapper}>
            <div
              className={`${styles.menuCard} ${expandedMenu === item.id && styles.selectedMenu}`}
              onClick={() => {
                if (isMinimized) setIsMinimized(!isMinimized);
                if (item.submenu) {
                  handleMenuItemClick(item.id);
                }
              }}
            >
              {iconMap[item.id as keyof typeof iconMap]}
              <span className={isMinimized ? styles.hidden : ""}>
                {item.label}
              </span>
              {item.submenu && (
                <MdExpandMore
                  className={`${styles.expandIcon} ${expandedMenu === item.id ? styles.rotated : ""} ${isMinimized ? styles.hidden : ""}`}
                />
              )}
            </div>
            {item.submenu && expandedMenu === item.id && !isMinimized && (
              <ul className={styles.submenu}>
                {item.submenu.map((subitem) => (
                  <Link key={subitem.id} href={`/${item.id}/${subitem.id}` || "#"} className={styles.link}>
                    <li key={subitem.id} className={styles.submenuItem}>
                      {subitem.label}
                    </li>
                  </Link>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Menu;