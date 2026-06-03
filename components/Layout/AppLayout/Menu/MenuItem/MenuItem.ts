export interface MenuItem {
    id: string;
    label: string;
    submenu?: Array<{ id: string; label: string }>;
}

const menuItemsAdmin: MenuItem[] = [
    {
        id: "dashboards",
        label: "DASHBOARDS",
        submenu: [
            { id: "dash-vendas", label: "Vendas" },
            { id: "faturamento", label: "Faturamento" },
            { id: "dash-comissoes", label: "Comissões" },
        ]
    },
    {
        id: "cadastros",
        label: 'CADASTROS',
        submenu: [
            { id: "exemplo", label: "exemplo" },
            { id: "usuarios", label: "usuarios" },
        ]
    },
    {
        id: "orcamento",
        label: "ORÇAMENTO",
        submenu: [
            { id: "produtos", label: "Catálogo de produtos" },
            { id: "fornecedores", label: "Fornecedores" },
        ]
    },
];
const menuItemsUser: MenuItem[] = [
    {
        id: "dashboard",
        label: "DASHBOARDS",
        submenu: [
            { id: "dash-vendas", label: "Vendas" },
            { id: "dash-faturamento", label: "Faturamento" },
            { id: "dash-comissoes", label: "Comissões" },
        ]
    },
    {
        id: "cadastros",
        label: 'CADASTROS',
        submenu: [
            { id: "exemplo", label: "exemplo" },
            { id: "usuarios", label: "usuarios" },
        ]
    },
    {
        id: "admin",
        label: 'PAINEL ADMIN',
        submenu: [
            {id: "usuarios", label: "usuarios"},
        ]
    },
    {
        id: "crm",
        label: "CRM",
    },
    {
        id: "vendas",
        label: "VENDAS e NF-e",
        submenu: [
            { id: "pedido-venda", label: "Pedido de venda" },
            { id: "notas-fiscais", label: "Notas Fiscais" }
        ]
    },
    {
        id: "servicos",
        label: "SERVIÇOS e NFS-e",
    },
    {
        id: "compras",
        label: "COMPRAS",
    },
    {
        id: "orcamento",
        label: "ORÇAMENTO",
        submenu: [
            { id: "produtos", label: "Catálogo de produtos" },
        ]
    },
];
const menuItemsVendedor: MenuItem[] = [
    {
        id: "dashboard",
        label: "DASHBOARDS",
        submenu: [
            { id: "dash-vendas", label: "Vendas" },
        ]
    },
    {
        id: "pcp",
        label: "PCP",
        submenu: [
            { id: "pcp-consulta", label: "Consulta" },
        ]
    },
    {
        id: "vendas",
        label: "VENDAS e NF-e",
        submenu: [
            { id: "pedido-venda", label: "Pedido de venda" },
            { id: "notas-fiscais", label: "Notas Fiscais" }
        ]
    },
    {
        id: "orcamento",
        label: "ORÇAMENTO",
        submenu: [
            { id: "produtos", label: "Catálogo de produtos" },
        ]
    },
];

const menuItems = {
    'admin': menuItemsAdmin,
    'user': menuItemsUser,
    'vendedor': menuItemsVendedor
}

export default menuItems;
