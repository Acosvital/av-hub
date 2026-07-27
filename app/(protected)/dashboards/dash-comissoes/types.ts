export interface PedidosComissoesProps {
  dataNF: string;
  status: string;
  cliente: string;
  'Margem_%': number;
  notaFiscal: string;
  comissaoPct: number;
  valorPedido: number;
  valorComissao: number;
  valorFaturado: number;
  valorPendente: number;
  Motivo_Bloqueio: string;
}

export interface VendedoresComissoesProps {
  pedidos: PedidosComissoesProps[];
  vendedor: string;
  AjudaCusto: number;
  totalPedidos: number;
  valorBloqueado: number;
  valorTotalComissao: number;
  valorTotalFaturado: number;
  valorTotalPendente: number;
  totalPedidosAFaturar: number;
  totalPedidosFaturados: number;
}

export interface CoordenadorProps {
  vendedor: string;
  totalPedidos: number;
  totalPedidosFaturados: number;
  totalPedidosAFaturar: number;
  valorTotalFaturado: number;
  valorTotalPendente: number;
  valorTotalComissao: number;
  AjudaCusto: number;
  porcentagemComissao: number;
  coordenador: boolean;
  valorBloqueado?: number;
  pedidos: unknown[];
}

export interface CoordenadoresProps {
  coordenadores: CoordenadorProps[];
  excessoes: CoordenadorProps[];
}

export interface ComissoesProvisoriasProps {
  mes: string;
  resumo: {
    pedidosOk: number;
    totalPedidos: number;
    pedidosEmErro: number;
    totalAjudaCusto: number;
    pedidosPendentes: number;
    valorTotalAFaturar: number;
    valorTotalComissao: number;
    valorTotalFaturado: number;
    pedidosSemSimulador: number;
    valorTotalBloqueado: number;
    totalPedidosAFaturar: number;
    totalPedidosFaturados: number;
  };
  ano_mes: string;
  gerado_em: string;
  vendedores: VendedoresComissoesProps[];
}
