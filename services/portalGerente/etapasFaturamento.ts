import { apiFetch } from '@/lib/api/fetchHelper';
import { FilterOption } from '@/components/Ui/SearchFilterBar/SearchFilterBar';

interface EtapaFaturamentoProps {
  codigo_empresa: string;
  codigo_etapa: number;
  descricao: string | null;
  descricao_padrao: string;
  ativo: boolean;
}

interface EtapasFaturamentoResponse {
  etapas_faturamento: EtapaFaturamentoProps[];
}

// Rótulo que o Omie usa pra etapa não customizada numa empresa — não é uma
// descrição de verdade, é só o "slot vazio" do catálogo.
const PLACEHOLDER_OMIE = '<disponível>';

// Monta as opções do filtro de Etapa com texto de verdade em vez do código
// cru — mas o MESMO código tem descrição DIFERENTE por empresa (confirmado
// ao vivo: etapa 20 é "Separar Estoque" numa filial e "Liberado Compras"
// noutra), então não dá pra escolher um rótulo único sem errar pra alguma
// empresa. Junta os textos distintos com " / " em vez de inventar um rótulo.
export async function getOpcoesFiltroEtapa(codigoOperacao = '11'): Promise<FilterOption[]> {
  const resposta = await apiFetch<EtapasFaturamentoResponse>(
    `/api/etapas_faturamento?codigo_operacao=${codigoOperacao}`,
    'Erro ao buscar etapas de faturamento'
  );

  const textosPorEtapa = new Map<number, Set<string>>();
  resposta.etapas_faturamento.forEach((e) => {
    const texto = e.descricao ?? e.descricao_padrao;
    const atual = textosPorEtapa.get(e.codigo_etapa) ?? new Set<string>();
    atual.add(texto);
    textosPorEtapa.set(e.codigo_etapa, atual);
  });

  return Array.from(textosPorEtapa.entries())
    .sort(([a], [b]) => a - b)
    .map(([codigo, textos]) => {
      const reais = Array.from(textos).filter((t) => t !== PLACEHOLDER_OMIE);
      const finalTextos = reais.length > 0 ? reais : Array.from(textos);
      return { value: String(codigo), label: finalTextos.join(' / ') };
    });
}
