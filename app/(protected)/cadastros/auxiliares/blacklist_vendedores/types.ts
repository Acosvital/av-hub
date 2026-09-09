// Espelha /blacklist_vendedores da API — PK é o próprio nome_vendedor (sem
// id numérico). Usado pelas views analíticas (vw_faturamento_planilha_resumo,
// vw_vendas_planilha_resumo etc.) pra excluir vendedores bloqueados por
// comparação parcial, sem acento, case-insensitive.
export interface BlacklistVendedorProps {
  nome_vendedor: string;
  motivo: string | null;
  created_at?: string;
}

export interface FormBlacklistVendedor {
  nome_vendedor: string;
  motivo: string;
}
