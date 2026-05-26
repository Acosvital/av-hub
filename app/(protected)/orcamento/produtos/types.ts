export type ProdutoProps = {
  "id_produto_omie": string,
  "codigo_produto": string,
  "descricao": string,
  "familia": string,
  "unidade_medida": string,
  "ativo": boolean,
  "id_parceiro_mais_recente": string,
  "nome_fantasia": string,
  "cotacao_mais_recente": string,
  "data_cotacao_mais_recente": string,
  "estado": string,
  "preco_medio_ultimas_cotacoes": string,
  "total_cotacoes": string,
  "email": string,
  "telefone": string,
  "cidade": string,
  "logradouro": string,
  "numero": string,
};

export type FornecedorProps = {
  codigo_parceiro_omie: string;
  email: string;
  estado: string;
  nome_fantasia: string;
  telefone: string;
}

export type FamiliaProdutosProps = {
  ativo: boolean;
  codigo_fprodutos: string;
  nome: string;
}

export type PriceHistoryProps = {
  "id_produto": string,
  "id_parceiro": string,
  "data_cotacao": string,
  "valor_unidade": string
}