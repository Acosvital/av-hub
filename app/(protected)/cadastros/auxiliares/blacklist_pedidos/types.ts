// Espelha /blacklist_pedidos da API — PK é o próprio numero_pedido (sem id
// numérico). Usado pelas views analíticas (vw_vendas_planilha_resumo etc.)
// pra excluir pedidos bloqueados do bruto/deduções.
//
// codigo_empresa é obrigatório na tabela (NOT NULL) mesmo não aparecendo na
// doc da API — numero_pedido não é único entre empresas, então sem a unidade
// não dá pra saber qual pedido bloquear quando duas empresas usam o mesmo
// número (confirmado ao vivo: POST sem codigo_empresa devolve 400 "Campo
// obrigatório não informado: codigo_empresa").
export interface BlacklistPedidoProps {
  numero_pedido: string;
  codigo_empresa: string;
  motivo: string | null;
  created_at?: string;
}

export interface FormBlacklistPedido {
  numero_pedido: string;
  codigo_empresa: string;
  motivo: string;
}
