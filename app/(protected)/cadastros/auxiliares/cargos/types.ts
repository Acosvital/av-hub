// Dicionário de nome/cor/categoria por nível hierárquico agora vem de
// GET /niveis_hierarquicos (services/cadastros/auxiliares/nivelHierarquico.ts)
// — fonte única compartilhada com o Organograma, no lugar do dicionário
// que existia hardcoded aqui (ver docs/organograma-integridade-schema.md).

export interface CargoProps {
  id: string;
  codigo_empresa: string;
  id_setor: string;
  nome: string;
  nvl_permissao: number;
  // Desempate de senioridade dentro do mesmo nvl_permissao, usado quando um
  // setor subdivide um nível em mentoria (ex.: Analista Júnior 1/2/3, Pleno,
  // Sênior). Opcional porque o backend ainda não tem essa coluna — ausente
  // equivale a 0 (sem subdivisão).
  sub_nivel?: number;
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
  sub_nivel: number;
  descricao: string;
  ativo: boolean;
}
