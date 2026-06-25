const toBRL = (n: number | null) =>
  n ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';

export default toBRL;
