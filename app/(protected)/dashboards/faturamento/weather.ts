import toBRL from "@/utils/toBRL";

export const dataset = [
    {
        faturamento: 12859477.01,
        mes: 'Jan',
    },
    {
        faturamento: 19954717.11,
        mes: 'Fev',
    },
    {
        faturamento: 22524206.82,
        mes: 'Mar',
    },
    {
        faturamento: 26159984.09,
        mes: 'Abr',
    },
    {
        faturamento: 23119350.16,
        mes: 'Mai',
    },    
    {
        faturamento: 3107579.29,
        mes: 'Jun',
    },    
];

export function valueFormatter(value: number | null) {
    return value != null ? toBRL(value) : '';
}
