import { getFuncionarios } from '@/services/rh/funcionarios';
import { getCargos } from '@/services/cadastros/auxiliares/cargos';
import { getSetores } from '@/services/cadastros/auxiliares/setores';

// Nível mínimo de cargo que participa da hierarquia dentro do setor.
// 0-1 (Diretoria/Gerência Geral) são raízes globais; 2-3 são reservados
// a nós estruturais do próprio setor (nenhum cargo usa esses níveis).
export const NIVEL_MINIMO_HIERARQUIA = 4;

export interface OrganogramaNodeProps {
  id: string;
  parent_id: string | null;
  is_sector: boolean;
  id_ent: string;
  created_at?: string;
  updated_at?: string;
}

export async function getOrganogramaNode(id: string): Promise<OrganogramaNodeProps | null> {
  const res = await fetch(`/api/organograma_nodes/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Erro ao buscar nó do organograma (status ${res.status})`);
  return res.json();
}

async function criarOrganogramaNode(id: string, parentId: string | null) {
  const res = await fetch('/api/organograma_nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, id_ent: id, parent_id: parentId }),
  });
  if (!res.ok) throw new Error(`Erro ao criar nó do organograma (status ${res.status})`);
  return res.json();
}

async function editarOrganogramaNode(id: string, parentId: string | null) {
  const res = await fetch(`/api/organograma_nodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_id: parentId }),
  });
  if (!res.ok) throw new Error(`Erro ao atualizar nó do organograma (status ${res.status})`);
  return res.json();
}

export async function deletarOrganogramaNode(id: string) {
  const res = await fetch(`/api/organograma_nodes/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Erro ao remover nó do organograma (status ${res.status})`);
  }
}

// Cria ou atualiza o nó, só gravando quando o pai realmente muda.
async function upsertNode(id: string, parentId: string | null) {
  const existente = await getOrganogramaNode(id);
  if (!existente) {
    await criarOrganogramaNode(id, parentId);
    return;
  }
  if (existente.parent_id !== parentId) {
    await editarOrganogramaNode(id, parentId);
  }
}

// Um setor só ganha nó quando alguém precisa reportar a ele. Garante a
// cadeia até a raiz, já que o pai precisa existir antes (FK no banco).
async function ensureSetorNode(setorId: string): Promise<void> {
  const existente = await getOrganogramaNode(setorId);
  if (existente) return;

  const { setores } = await getSetores({ limit: 500 });
  const setor = setores.find((s) => s.id === setorId);
  if (!setor) return;

  let parentNodeId: string | null = null;
  if (setor.parent_id) {
    await ensureSetorNode(setor.parent_id);
    parentNodeId = setor.parent_id;
  }
  await criarOrganogramaNode(setorId, parentNodeId);
}

// Aplica a escolha manual de "reporta a" no nó do funcionário — chamado
// sempre depois do recálculo automático, para não ser sobrescrito por ele.
export async function definirReportaA(idFuncionario: string, idSuperior: string) {
  await upsertNode(idFuncionario, idSuperior);
}

// Chave de ordenação/agrupamento: nível primeiro, sub_nivel como desempate
// — mesma convenção do banco (fn_default_parent_pessoa, ver
// docs/organograma-integridade-schema.md item 6): número menor = mais
// sênior. sub_nivel é sempre 0-9 (CHECK no banco), então nivel*10+sub_nivel
// nunca colide entre níveis diferentes.
function chaveHierarquia(nivel: number, subNivel: number): number {
  return nivel * 10 + subNivel;
}

// Redistribui quem reporta a quem dentro de um setor, com base no par
// (nível, sub_nivel) do cargo de cada funcionário atualmente no setor:
// - quem tem o par mais alto do setor reporta direto ao setor;
// - os demais reportam ao par imediatamente acima, em round-robin quando
//   há mais de uma pessoa nesse par — o que também encadeia sub-níveis de
//   mentoria (ex.: Júnior 1→2→3→Pleno→Sênior) entre si em vez de tratá-los
//   como irmãos do mesmo nvl_permissao.
export async function recomputeSectorHierarchy(setorId: string): Promise<void> {
  const [{ funcionarios }, { cargos }] = await Promise.all([
    getFuncionarios({ id_setor: setorId, limit: 500 }),
    getCargos({ limit: 1000 }),
  ]);

  const cargoPorId = new Map(cargos.map((c) => [c.id, chaveHierarquia(c.nvl_permissao, c.sub_nivel ?? 0)]));
  const elegiveis = funcionarios
    .filter((f) => Math.floor((cargoPorId.get(f.id_cargo) ?? -10) / 10) >= NIVEL_MINIMO_HIERARQUIA)
    .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));

  if (elegiveis.length === 0) return;

  const chavesOrdenadas = [...new Set(elegiveis.map((f) => cargoPorId.get(f.id_cargo)!))].sort(
    (a, b) => a - b
  );
  const grupos = chavesOrdenadas.map((chave) =>
    elegiveis.filter((f) => cargoPorId.get(f.id_cargo) === chave)
  );

  await ensureSetorNode(setorId);

  const [topo, ...resto] = grupos;
  await Promise.all(topo.map((f) => upsertNode(f.id, setorId)));

  let grupoAnterior = topo;
  for (const grupo of resto) {
    await Promise.all(
      grupo.map((f, i) => upsertNode(f.id, grupoAnterior[i % grupoAnterior.length].id))
    );
    grupoAnterior = grupo;
  }
}
