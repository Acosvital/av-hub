const dateFormatter = (data: string) => {
  const [ano, mes, dia] = data.split('-');

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
};

export default dateFormatter;
