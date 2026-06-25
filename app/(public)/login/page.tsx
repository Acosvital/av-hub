'use client';
import { signIn } from 'next-auth/react';
import styles from './styles.module.css';
import { TextField } from '@mui/material';
import Button from '@/components/Ui/Button/Button';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (!result?.ok) {
      setError('Email ou senha inválidos.');
      setLoading(false);
      return;
    }

    window.location.href = '/';
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { bgcolor: 'var(--navy-900)', color: 'var(--white)' },
    '& .MuiInputLabel-root': { color: 'var(--white)' },
    '& .MuiInputLabel-shrink': { backgroundColor: 'var(--navy-900)', padding: '0 4px' },
    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
      WebkitBoxShadow: '0 0 0 1000px var(--navy-900) inset',
      WebkitTextFillColor: 'white',
      transition: 'background-color 5000s ease-in-out 0s',
    },
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div>
          <img src="./logo.png" alt="logo Aços Vital" className={styles.logo} />
          <h1 className={styles.title}>Bem vindo ao Aços Hub</h1>
          <h2 className={styles.subTitle}>Acesse sua conta corporativa para continuar</h2>
        </div>

        <form
          onSubmit={handleCredentialsLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}
        >
          <TextField
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={inputSx}
          />
          <TextField
            label="Senha"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={inputSx}
          />
          {error && (
            <p style={{ color: 'var(--error, #f87171)', fontSize: 'var(--fs-sm)', margin: 0 }}>
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <button
          className={styles.loginButton}
          onClick={() => signIn('azure-ad', { prompt: 'select_account', callbackUrl: '/' })}
        >
          <svg
            className={styles.microsoftIcon}
            viewBox="0 0 23 23"
            xmlns="http://www.w3.org/2000/svg"
          >
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
