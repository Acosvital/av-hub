'use client';
import clsx from "clsx";
import styles from "./Card.module.css";

interface CardProps {
    children: React.ReactNode;
    title?: string
    className?: string
}

export default function Card({ children, title, className }: CardProps) {
    return (
        <div className={clsx(styles.card, className)}>
            {title && (<h2 className={styles.cardTitle}>{title}</h2>)}
            {children}
        </div>
    )
}