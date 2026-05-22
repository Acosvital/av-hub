'use client'
import { SessionProvider } from "next-auth/react";
import Header from "./Header/Header";
import Menu from "./Menu/Menu";
import styles from "./Layout.module.css";
import { Slide, ToastContainer } from "react-toastify";
const Layout = ({ children }: { children: React.ReactNode }) => {

  return (
    <SessionProvider>
      <div className={styles.app}>
        <Menu />
        <div className={styles.shell}>
          <Header />
          <main className={styles.mainArea}>
            {children}
          </main>
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        transition={Slide}
      />
    </SessionProvider>
  )
}

export default Layout;