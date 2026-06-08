import { BiSolidDashboard } from "react-icons/bi";
import { BsFillBoxFill } from "react-icons/bs";
import { FaCog, FaDatabase, FaMoneyBill } from "react-icons/fa";
import { MdHomeRepairService } from "react-icons/md";
import { SiCivicrm } from "react-icons/si";
import { TbPigMoney } from "react-icons/tb";
const style = {
    'fontSize': '1.5rem',
    'flexShrink': '0',
}

const iconMap = {
    dashboards: <BiSolidDashboard style={style} />,
    crm: <SiCivicrm style={style} />,
    vendas: <FaMoneyBill style={style} />,
    servicos: <MdHomeRepairService style={style} />,
    compras: <BsFillBoxFill style={style} />,
    orcamento: <TbPigMoney style={style} />,
    cadastros: <FaDatabase style={style} />,
    admin: <FaCog style={style} />,
    pcp: <FaCog style={style} />
}

export default iconMap;