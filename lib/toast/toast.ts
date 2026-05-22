import { toast, ToastOptions } from 'react-toastify';

const baseConfig: ToastOptions = {
    position: 'bottom-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export const notify = {
    success: (message: string) =>
        toast.success(message, {
            ...baseConfig,
            style: {
                background: 'var(--success)',
                color: 'var(--neutral-50)',
                fontFamily: 'var(--font-sans)',
            },
        }),

    error: (message: string) =>
        toast.error(message, {
            ...baseConfig,
            style: {
                background: 'var(--danger)',
                color: 'var(--neutral-50)',
                fontFamily: 'var(--font-sans)',
            },
        }),

    warning: (message: string) =>
        toast.warning(message, {
            ...baseConfig,
            style: {
                background: 'var(--warning)',
                color: 'var(--neutral-50)',
                fontFamily: 'var(--font-sans)',
            },
        }),

    info: (message: string) =>
        toast.info(message, {
            ...baseConfig,
            style: {
                background: 'var(--info)',
                color: 'var(--neutral-50)',
                fontFamily: 'var(--font-sans)',
            },
        }),
};