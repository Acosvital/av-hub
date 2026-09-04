import { apiFetch } from '@/lib/api/fetchHelper';

export interface NivelHierarquicoProps {
  nivel: number;
  nome: string;
  cor: string;
  categoria: 'estrutural' | 'pessoa';
  ativo: boolean;
}

// Mesmo dicionário que já existia hardcoded em cargos/types.ts — mantido
// só como fallback pra tela não quebrar enquanto GET /niveis_hierarquicos
// não existir no backend (ver docs/organograma-integridade-schema.md,
// item 1). Os nomes vão divergir um pouco dos que o endpoint real traz
// (ex.: "Gerente" aqui vs "Gerência de Setor" na tabela nova) — é
// esperado, o dicionário real passa a ser a fonte única quando existir.
const NIVEIS_FALLBACK: NivelHierarquicoProps[] = [
  { nivel: 0, nome: 'Diretoria', cor: '#f59e0b', categoria: 'pessoa', ativo: true },
  { nivel: 1, nome: 'Gerência Geral', cor: '#3b82f6', categoria: 'pessoa', ativo: true },
  { nivel: 4, nome: 'Diretor de Setor', cor: '#f59e0b', categoria: 'pessoa', ativo: true },
  { nivel: 5, nome: 'Gerente', cor: '#6366f1', categoria: 'pessoa', ativo: true },
  { nivel: 6, nome: 'Coordenador', cor: '#8b5cf6', categoria: 'pessoa', ativo: true },
  { nivel: 7, nome: 'Supervisor', cor: '#d946ef', categoria: 'pessoa', ativo: true },
  { nivel: 8, nome: 'Líder de Equipe', cor: '#ec4899', categoria: 'pessoa', ativo: true },
  { nivel: 9, nome: 'Analista', cor: '#10b981', categoria: 'pessoa', ativo: true },
  { nivel: 10, nome: 'Assistente / Auxiliar', cor: '#14b8a6', categoria: 'pessoa', ativo: true },
  { nivel: 11, nome: 'Auxiliar / Estagiário', cor: '#06b6d4', categoria: 'pessoa', ativo: true },
  { nivel: 12, nome: 'Aprendiz', cor: '#94a3b8', categoria: 'pessoa', ativo: true },
];

let cache: NivelHierarquicoProps[] | null = null;

// O dicionário muda raramente — cacheia em memória pro processo do
// cliente (recarrega a cada refresh de página). Não cacheia o fallback:
// assim que o backend subir o endpoint, a próxima chamada já pega o
// dado real sem precisar de reload.
export async function getNiveisHierarquicos(): Promise<NivelHierarquicoProps[]> {
  if (cache) return cache;
  try {
    const data = await apiFetch<NivelHierarquicoProps[]>(
      '/api/niveis-hierarquicos',
      'Erro ao buscar níveis hierárquicos'
    );
    cache = data;
    return data;
  } catch {
    return NIVEIS_FALLBACK;
  }
}
