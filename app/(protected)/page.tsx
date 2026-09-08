'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { encontrarPathDoItem } from '@/utils/menuTree';
import styles from './styles.module.css';

// FALLBACK TEMPORÁRIO — remover quando todo perfil relevante tiver
// tela_inicial_id configurado no cadastro de Perfis (depende do backend
// expor esse campo; ver InfoPerfisDoUsuario em
// app/api/auth/[...nextauth]/route.ts). Enquanto isso, perfis sem essa
// configuração caem aqui, comparando por nome.
const PERFIS_REDIRECIONAM_RH_FALLBACK = ['RH - Joanes', 'RH - Analistas'];
const ROTA_SOLICITACOES_DE_VAGAS_FALLBACK = '/rh/solicitacoes-de-vagas';
const PERFIS_REDIRECIONAM_VENDEDOR_FALLBACK = ['Vendedor'];
const ROTA_MEU_DASHBOARD_FALLBACK = '/meu-dashboard';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;

    // Caminho oficial: tela inicial configurada no perfil do usuário,
    // resolvida andando a árvore do próprio menu (nenhum mapa de rotas
    // hardcoded — o menu já é a fonte da verdade de id -> rota).
    const menu = session?.user?.menu ?? [];
    const telaInicialId = session?.user?.telaInicialId;
    if (telaInicialId) {
      const path = encontrarPathDoItem(menu, telaInicialId);
      if (path) {
        router.replace(`/${path}`);
        return;
      }
    }

    const nomesDoUsuario = session?.user?.perfis ?? [];
    if (nomesDoUsuario.some((nome) => PERFIS_REDIRECIONAM_RH_FALLBACK.includes(nome))) {
      router.replace(ROTA_SOLICITACOES_DE_VAGAS_FALLBACK);
      return;
    }
    if (nomesDoUsuario.some((nome) => PERFIS_REDIRECIONAM_VENDEDOR_FALLBACK.includes(nome))) {
      router.replace(ROTA_MEU_DASHBOARD_FALLBACK);
    }
  }, [status, session?.user?.menu, session?.user?.telaInicialId, session?.user?.perfis, router]);

  return <div className={`${styles.dashboardContainer}`}></div>;
}
