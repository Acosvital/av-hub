'use client';
import styles from "./Button.module.css";

interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
    onClick?: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export default function Button({ children, variant = 'primary', onClick, icon, disabled }: ButtonProps) {
    return (
        <button
            type="button"
            className={`${styles.button} ${styles[variant]}`}
            onClick={onClick}
            disabled={disabled}
        >
            {icon} {children}
        </button>
    )
}