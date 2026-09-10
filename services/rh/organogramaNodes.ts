import { getFuncionarios } from '@/services/rh/funcionarios';

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

// Aplica a escolha manual de "reporta a" no nó do funcionário. O banco já
// calcula um pai padrão sozinho quando não existe nó (fn_default_parent_pessoa,
// ver docs/organograma-hierarquia-schema.md — contrato já implementado pelo
// DBA) — este service só precisa gravar quando o usuário escolhe alguém
// manualmente. NÃO recalcular/gravar o padrão automático aqui: qualquer
// linha em core_organograma.node é tratada pela view como override
// permanente, então gravar o resultado do cálculo automático "trava" esse
// funcionário nele, escondendo o default de verdade e impedindo que outras
// pessoas do setor sejam redistribuídas quando o quadro muda.
export async function definirReportaA(idFuncionario: string, idSuperior: string) {
  await upsertNode(idFuncionario, idSuperior);
}

// Remove qualquer override manual do setor que aponte para um funcionário
// específico — usado ao excluir alguém, para não deixar colegas presos a um
// "reporta a" que agora aponta para ninguém. Sem isso, o override
// sobrevive (a view não sabe que o alvo sumiu) e a pessoa desaparece do
// organograma em vez de cair de volta no cálculo automático.
export async function limparOverridesApontandoPara(setorId: string, idAlvo: string): Promise<void> {
  const { funcionarios } = await getFuncionarios({ id_setor: setorId, limit: 500 });
  await Promise.all(
    funcionarios.map(async (f) => {
      const node = await getOrganogramaNode(f.id);
      if (node?.parent_id === idAlvo) {
        await deletarOrganogramaNode(f.id);
      }
    })
  );
}
