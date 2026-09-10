'use client';
import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import Modal from '@/components/Ui/Modal/Modal';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import TIPO_CONTRATO_COLORS from '@/utils/tipoContratoColors';
import {
  getPedidosDoCliente,
  PedidoClienteProps,
} from '@/services/portalVendedor/pedidosDoCliente';
import styles from './ClienteDetalhesModal.module.css';

export interface ClienteDetalhesProps {
  nome: string;
  codigoCliente?: string;
  codigoEmpresa?: string;
  valorMes?: number;
  qtdPedidosMes?: number;
  valorUltimaCompra?: number;
  valorTotalHistorico?: number;
  ultimaCompra?: string;
  diasSemComprar?: number;
}

interface ClienteDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteDetalhesProps | null;
  mes: number;
  ano: number;
}

const ClienteDetalhesModal = ({ isOpen, onClose, cliente, mes, ano }: ClienteDetalhesModalProps) => {
  const [pedidos, setPedidos] = useState<PedidoClienteProps[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !cliente?.codigoCliente) return;
    let ativo = true;
    async function carregarPedidos() {
      try {
        setLoading(true);
        const res = await getPedidosDoCliente({
          codigo_cliente: cliente!.codigoCliente!,
          codigo_empresa: cliente!.codigoEmpresa,
          mes,
          ano,
        });
        if (ativo) setPedidos(res.data ?? []);
      } catch (err) {
        console.error(err);
        if (ativo) setPedidos([]);
      } finally {
        if (ativo) setLoading(false);
      }
    }
    carregarPedidos();
    return () => {
      ativo = false;
    };
    // Depende só de codigoCliente/codigoEmpresa (não do objeto `cliente`
    // inteiro): o pai recria esse objeto a cada render, o que refetcharia à
    // toa mesmo sem trocar de cliente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cliente?.codigoCliente, cliente?.codigoEmpresa, mes, ano]);

  if (!cliente) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do cliente" subtitle={cliente.nome}>
      <div className={styles.modalContent}>
        <div className={styles.resumo}>
          {cliente.valorMes !== undefined && (
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Valor no mês</span>
              <span className={styles.resumoValor}>{toBRL(cliente.valorMes)}</span>
            </div>
          )}
          {cliente.qtdPedidosMes !== undefined && (
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Pedidos no mês</span>
              <span className={styles.resumoValor}>{cliente.qtdPedidosMes}</span>
            </div>
          )}
          {cliente.ultimaCompra && (
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Última compra</span>
              <span className={styles.resumoValor}>{dateFormatter(cliente.ultimaCompra)}</span>
            </div>
          )}
          {cliente.diasSemComprar !== undefined && (
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Dias sem comprar</span>
              <span className={styles.resumoValorAlerta}>{cliente.diasSemComprar} dias</span>
            </div>
          )}
          {cliente.valorUltimaCompra !== undefined && (
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Valor da última compra</span>
              <span className={styles.resumoValor}>{toBRL(cliente.valorUltimaCompra)}</span>
            </div>
          )}
          {cliente.valorTotalHistorico !== undefined && (
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Valor total histórico</span>
              <span className={styles.resumoValor}>{toBRL(cliente.valorTotalHistorico)}</span>
            </div>
          )}
        </div>

        <p className={styles.sectionLabel}>Pedidos no mês selecionado</p>
        {loading ? (
          <div className={styles.loading}>
            <CircularProgress size={40} />
            <span>Carregando...</span>
          </div>
        ) : !cliente.codigoCliente ? (
          <p className={styles.vazio}>Sem código de cliente disponível para buscar os pedidos.</p>
        ) : pedidos && pedidos.length === 0 ? (
          <p className={styles.vazio}>Nenhum pedido desse cliente no mês selecionado.</p>
        ) : (
          <div className={styles.listaPedidos}>
            {pedidos?.map((p) => (
              <div key={p.codigo_pedido_omie} className={styles.linhaPedido}>
                <span className={styles.numeroPedido}>Pedido nº {p.numero_pedido ?? '—'}</span>
                <span className={styles.dataPedido}>
                  {p.data_inclusao ? dateFormatter(p.data_inclusao) : '—'}
                  {p.etapa_descricao && ` · ${p.etapa_descricao}`}
                </span>
                {p.tipo_contrato && (
                  <span
                    className={styles.tipoContratoChip}
                    style={{ backgroundColor: TIPO_CONTRATO_COLORS[p.tipo_contrato] }}
                  >
                    {p.tipo_contrato}
                  </span>
                )}
                <span className={styles.valorPedido}>{toBRL(p.total_pedido)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ClienteDetalhesModal;
