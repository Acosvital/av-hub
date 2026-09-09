'use client';
import { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import Modal from '@/components/Ui/Modal/Modal';
import { ApiFetchError } from '@/lib/api/fetchHelper';
import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import OrderType from '@/components/Dashboards/OrderType/OrderType';
import Order from '@/components/Dashboards/Order/Order';
import toBRL from '@/utils/toBRL';
import { getDetalheVendedorVendas } from '@/services/dashboards/dashboardVendas';
import { getDetalheVendedorFaturamento } from '@/services/dashboards/dashboardFaturamento';
import {
  ORDER_CATEGORIES,
  OrderCategory,
  OrderTypeKey,
  VendorDetails,
  mapVendorDetails,
} from '@/services/dashboards/vendorDetailsMapper';
import styles from './VendorDetailsModal.module.css';

interface VendorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: number | null;
  filialId: string | null;
  dashboard: 'vendas' | 'faturamento';
  mes: number;
  ano: number;
}

const VendorDetailsModal = ({
  isOpen,
  onClose,
  vendorId,
  filialId,
  dashboard,
  mes,
  ano,
}: VendorDetailsModalProps) => {
  const [details, setDetails] = useState<VendorDetails | null>(null);
  const [selectedType, setSelectedType] = useState<OrderTypeKey | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleTypeClick = (type: OrderTypeKey) => {
    setSelectedType((prev) => (prev === type ? null : type));
  };

  const filteredOrders =
    details?.orders.filter((order) => {
      if (!selectedType) return true;
      if (ORDER_CATEGORIES.includes(selectedType as OrderCategory)) {
        return order.category === selectedType;
      }
      return order.status === selectedType;
    }) ?? [];

  useEffect(() => {
    if (!isOpen || vendorId === null) return;
    async function loadVendorDetails() {
      try {
        setLoading(true);
        setErro(null);
        setDetails(null);
        const getDetalheVendedor =
          dashboard === 'vendas' ? getDetalheVendedorVendas : getDetalheVendedorFaturamento;
        const res = await getDetalheVendedor({
          codigo_empresa: filialId ?? '',
          cod_vendedor: String(vendorId),
          mes,
          ano,
          limit: '500',
        });
        setDetails(mapVendorDetails(dashboard, res.vendedor, res.detalhes));
      } catch (err) {
        // 404 aqui é resposta normal do backend ("sem pedido/NF pra esse
        // filtro"), não uma falha — mensagem própria em vez do genérico de
        // "não consegui carregar", e sem logar como erro (não é um).
        const semResultado = err instanceof ApiFetchError && err.status === 404;
        if (!semResultado) console.error(err);
        setErro(
          semResultado
            ? `Nenhum${dashboard === 'vendas' ? ' pedido' : 'a nota fiscal'} encontrad${dashboard === 'vendas' ? 'o' : 'a'} pra esse vendedor no período.`
            : 'Não foi possível carregar os detalhes desse vendedor. Tente de novo em instantes.'
        );
      } finally {
        setLoading(false);
      }
    }
    loadVendorDetails();
  }, [isOpen, vendorId, filialId, dashboard, mes, ano]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do vendedor">
      {loading ? (
        <div className={styles.loading}>
          <CircularProgress size={50} />
          <span>Carregando...</span>
        </div>
      ) : erro ? (
        <div className={styles.erro}>
          <span>{erro}</span>
        </div>
      ) : (
        details && (
          <div className={styles.modalContent}>
            <div className={styles.vendorDetails}>
              <div className={styles.quickView}>
                <div className={styles.quickViewTitle}>
                  <Avatar name={details.name} size={50} />
                  <h3>{details.name}</h3>
                </div>
                <div className={styles.quickViewValues}>
                  <div>
                    <h4>Valor Total</h4>
                    <h3>{toBRL(details.totalValue)}</h3>
                  </div>
                  <div>
                    <h4>Total Pedidos</h4>
                    <h3>{details.totalOrders}</h3>
                  </div>
                </div>
              </div>
              <div className={styles.ordersTypesCount}>
                {details.orderTypes.map(({ orderType, count, value, cardType }) => {
                  if (
                    dashboard === 'vendas' &&
                    ['CANCELADOS', 'DEVOLVIDOS', 'RECUSADOS', 'REFATURAMENTO'].some(
                      (type) => type === orderType
                    )
                  )
                    return;
                  return (
                    <OrderType
                      key={orderType}
                      orderType={orderType}
                      count={count}
                      value={value}
                      cardType={cardType}
                      isActive={selectedType === orderType}
                      onClick={() => handleTypeClick(orderType)}
                    />
                  );
                })}
              </div>
            </div>
            <div className={styles.allOrders}>
              {filteredOrders.map((order, i) => (
                <Order key={i} {...order} />
              ))}
            </div>
          </div>
        )
      )}
    </Modal>
  );
};

export default VendorDetailsModal;
