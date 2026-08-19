'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getUsuariosPerfis } from '@/services/cadastros/acessos/usuariosPerfis';
import { getPerfis } from '@/services/cadastros/acessos/perfis';
import styles from './styles.module.css';

// TODO: lógica provisória — remover quando houver uma regra definitiva de tela inicial por perfil.
const PERFIS_REDIRECIONAM_RH = ['RH - Joanes', 'RH - Analistas'];
const ROTA_SOLICITACOES_DE_VAGAS = '/rh/solicitacoes-de-vagas';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id_usuario) return;

    let active = true;

    Promise.all([
      getUsuariosPerfis({ id_usuario: session.user.id_usuario, limit: 50 }),
      getPerfis({ limit: 1000 }),
    ])
      .then(([vinculosRes, perfisRes]) => {
        if (!active) return;
        const perfisById = new Map((perfisRes.perfis ?? []).map((perfil) => [perfil.id, perfil.nome]));
        const nomesDoUsuario = (vinculosRes.data ?? []).map(
          (vinculo) => vinculo.perfil_nome ?? perfisById.get(vinculo.id_perfil)
        );
        if (nomesDoUsuario.some((nome) => nome && PERFIS_REDIRECIONAM_RH.includes(nome))) {
          router.replace(ROTA_SOLICITACOES_DE_VAGAS);
          return;
        }
        setCheckingRedirect(false);
      })
      .catch(() => setCheckingRedirect(false));

    return () => {
      active = false;
    };
  }, [status, session?.user?.id_usuario, router]);

  if (checkingRedirect) return null;

  return <div className={`${styles.dashboardContainer}`}></div>;
}
