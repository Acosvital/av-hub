import {
  LuLayoutDashboard,
  LuHandshake,
  LuShoppingCart,
  LuWrench,
  LuPackage,
  LuPiggyBank,
  LuDatabase,
  LuSettings,
  LuFactory,
  LuUsers,
} from 'react-icons/lu';

const style = {
  fontSize: '1.35rem',
  flexShrink: '0',
};

const iconMap = {
  dashboards: <LuLayoutDashboard style={style} />,
  crm: <LuHandshake style={style} />,
  vendas: <LuShoppingCart style={style} />,
  servicos: <LuWrench style={style} />,
  compras: <LuPackage style={style} />,
  orcamento: <LuPiggyBank style={style} />,
  cadastros: <LuDatabase style={style} />,
  admin: <LuSettings style={style} />,
  pcp: <LuFactory style={style} />,
  rh: <LuUsers style={style} />,
};

export default iconMap;
