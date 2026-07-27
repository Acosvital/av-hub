const toBRL = (n: number | string | null | undefined) => {
  const value = Number(n);
  return n != null && !Number.isNaN(value)
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '';
};

export default toBRL;
