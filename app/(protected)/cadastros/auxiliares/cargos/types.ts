// Hierarquia fixa da empresa — quem edita esses nomes/níveis é via deploy,
// não existe tela de administração para isso (ver decisão no chat).
export const NIVEIS_HIERARQUICOS: Record<number, string> = {
  0: 'Diretoria',
  1: 'Gerência Geral',
  4: 'Diretor de Setor',
  5: 'Gerente',
  6: 'Coordenador',
  7: 'Supervisor',
  8: 'Líder de Equipe',
  9: 'Analista',
  10: 'Assistente / Auxiliar',
  11: 'Auxiliar / Estagiário',
  12: 'Aprendiz',
};

export interface CargoProps {
  id: string;
  codigo_empresa: string;
  id_setor: string;
  nome: string;
  nvl_permissao: number;
  descricao: string;
  ativo: boolean;
  id_origem?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormCargo {
  codigo_empresa: string;
  id_setor: string;
  nome: string;
  nvl_permissao: number | '';
  descricao: string;
  ativo: boolean;
}
