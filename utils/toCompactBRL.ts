const toCompactBRL = (n: number | string | null | undefined) => {
  const value = Number(n);
  return n != null && !Number.isNaN(value)
    ? value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1,
      })
    : '';
};

export default toCompactBRL;
