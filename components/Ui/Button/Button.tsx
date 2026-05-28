'use client';
import { IconBaseProps } from "react-icons";
import styles from "./Button.module.css";

interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
    onClick?: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
}

export default function Button({ children, variant = 'primary', onClick, icon }: ButtonProps) {
    return (
        <button
            type="button"
            className={`${styles.button} ${styles[variant]}`}
            onClick={onClick}
        >
            {icon} {children}
        </button>
    )
}