'use client';
import { signIn } from 'next-auth/react';
import styles from './styles.module.css';
import { TextField } from '@mui/material';
import Button from '@/components/Ui/Button/Button';
import { useState } from 'react';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div>
          <img src='./logo.png' alt="logo Aços Vital" className={styles.logo} />
          <h1 className={styles.title}>Bem vindo ao Aços Hub</h1>
          <h2 className={styles.subTitle}>Acesse sua conta corporativa para continuar</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
          <TextField
            label="Login"
            variant="outlined"
            type='email'
            value={login}
            onChange={(e) => { setLogin(e.target.value) }}
            slotProps={{
              inputLabel: { shrink: true }
            }}
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: 'var(--navy-900)', color: 'var(--white)' },
              '& .MuiInputLabel-root': { color: 'var(--white)' },
              '& .MuiInputLabel-animated': { backgroundColor: 'transparent' }
            }}
          />
          <TextField
            label="Senha"
            variant="outlined"
            type='password'
            value={password}
            onChange={(e) => { setPassword(e.target.value) }}
            slotProps={{
              inputLabel: { shrink: true }
            }}
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: 'var(--navy-900)', color: 'var(--white)' },
              '& .MuiInputLabel-root': { color: 'var(--white)' },
              '& .MuiInputLabel-animated': { backgroundColor: 'transparent' }
            }}
          />
          <Button>Entrar</Button>
        </div>
        <button
          className={styles.loginButton}
          onClick={() => signIn("azure-ad", { prompt: "select_account", callbackUrl: "/" })}
        >
          <svg className={styles.microsoftIcon} viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h23v23H0z" fill="#f3f3f3"></path>
            <path d="M1 1h10v10H1z" fill="#f35325"></path>
            <path d="M12 1h10v10H12z" fill="#81bc06"></path>
            <path d="M1 12h10v10H1z" fill="#05a6f0"></path>
            <path d="M12 12h10v10H12z" fill="#ffba08"></path>
          </svg>
          <span>Entrar com Microsoft</span>
        </button>
        <p className={styles.loginInfo}>
          Ao entrar, você concorda que o processamento de dados segue os padrões de conformidade do
          <span> Aços Hub</span>.
        </p>
      </div>
    </div>
  );
}