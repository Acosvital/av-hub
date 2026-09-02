import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './OverlayHeader.module.css';
import useLayout from '@/hooks/useLayout';
import { useSession } from 'next-auth/react';
import ThemeToggle from '../Header/ThemeToggle/ThemeToggle';
import {
  MdBusiness,
  MdFullscreen,
  MdFullscreenExit,
  MdOutlineHistory,
  MdSearch,
} from 'react-icons/md';
import { GiHamburgerMenu } from 'react-icons/gi';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { ptBR } from '@mui/x-date-pickers/locales';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { FaRegCalendarAlt } from 'react-icons/fa';
import useDashboardDate from '@/hooks/useDashboardDate';
import useDashboardEmpresa from '@/hooks/useDashboardEmpresa';
import useDashboardVendorModal from '@/hooks/useDashboardVendorModal';
import useDashboardHistorico from '@/hooks/useDashboardHistorico';
import { getUnidades } from '@/services/cadastros/auxiliares/unidades';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';
import { getPedidosVenda } from '@/services/vendas/pedidosVenda';
import { getNotasFiscaisSaida } from '@/services/vendas/notasFiscaisSaida';
import { getVendedores, VendedorProps } from '@/services/vendas/vendedores';
import { notify } from '@/lib/toast/toast';
import toBRL from '@/utils/toBRL';

const SEARCHABLE_DASHBOARDS = [
  '/dashboards/dash-vendas',
  '/dashboards/dash-vendas-por-tipo',
  '/dashboards/dash-faturamento',
  '/dashboards/dash-faturamento-por-tipo',
];

interface SearchResult {
  type: 'pedido' | 'nf';
  numero: string;
  vendedorCodigo: string;
  vendedorNome: string;
  empresaNome: string;
  empresaId: string;
  valor: number;
  data: string | null;
  status: string;
}

const OverlayHeader = () => {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpenDatePicker, setIsOpenDatePicker] = useState(false);
  const [isOpenEmpresaPicker, setIsOpenEmpresaPicker] = useState(false);
  const [isOpenSearch, setIsOpenSearch] = useState(false);
  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);
  const [vendedores, setVendedores] = useState<VendedorProps[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const { fullscreen, setFullscreen, setMobileMenuOpen } = useLayout();
  const dateFilters = useRef<HTMLDivElement>(null);
  const empresaFilters = useRef<HTMLDivElement>(null);
  const searchFilters = useRef<HTMLDivElement>(null);
  const [mouseVisible, setMouseVisible] = useState(true);
  const visible = !fullscreen || mouseVisible;
  const { completeDate, setCompleteDate } = useDashboardDate();
  const { codigoEmpresa, setCodigoEmpresa } = useDashboardEmpresa();
  const { requestVendorModal } = useDashboardVendorModal();
  const { isHistorico, setIsHistorico } = useDashboardHistorico();
  const empresaSelecionada = unidades.find((u) => u.id === codigoEmpresa);
  const showOrderSearch = SEARCHABLE_DASHBOARDS.includes(pathname ?? '');

  useEffect(() => {
    if (status !== 'authenticated') return;
    getUnidades({ limit: 100 })
      .then((res) => setUnidades(res.unidades ?? []))
      .catch((error) => console.error(error));
  }, [status]);

  // Carregado só quando a busca é aberta pela primeira vez — a lista de
  // vendedores não é usada em mais nada nesse componente.
  useEffect(() => {
    if (!isOpenSearch || vendedores.length > 0) return;
    getVendedores()
      .then((res) => setVendedores(res.data ?? []))
      .catch((error) => console.error(error));
  }, [isOpenSearch, vendedores.length]);

  useEffect(() => {
    document.documentElement.style.setProperty('--header-h', visible ? '84px' : '0px');
  }, [visible]);

  useEffect(() => {
    if (!fullscreen) {
      const id = setTimeout(() => setMouseVisible(true), 0);
      return () => clearTimeout(id);
    }

    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setMouseVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setMouseVisible(false), 3000);
    };

    timeout = setTimeout(() => setMouseVisible(false), 3000);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [fullscreen]);

  async function enterFullscreen() {
    await document.documentElement.requestFullscreen();
  }

  useEffect(() => {
    if (fullscreen) {
      enterFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [fullscreen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateFilters.current && !dateFilters.current.contains(event.target as Node)) {
        setIsOpenDatePicker(false);
      }
      if (empresaFilters.current && !empresaFilters.current.contains(event.target as Node)) {
        setIsOpenEmpresaPicker(false);
      }
      if (searchFilters.current && !searchFilters.current.contains(event.target as Node)) {
        setIsOpenSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDatePicker = () => {
    setIsOpenDatePicker((prev) => !prev);
  };

  const handleEmpresaPicker = () => {
    setIsOpenEmpresaPicker((prev) => !prev);
  };

  const handleHistoric = () => {
    setIsHistorico(!isHistorico);
  };

  const handleSelectEmpresa = (id: string | null) => {
    setCodigoEmpresa(id);
    setIsOpenEmpresaPicker(false);
  };

  const vendedorLabel = (codigo: string) => {
    const found = vendedores.find((v) => v.codigo_vendedor_omie === codigo);
    return found ? found.nome : codigo;
  };

  const empresaLabel = (id: string) => {
    const found = unidades.find((u) => u.id === id);
    return found ? found.nome_fantasia : id;
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    setSearchResults(null);
    try {
      const [pedidosRes, notasRes] = await Promise.allSettled([
        getPedidosVenda({ numero_pedido: query, limit: 5 }),
        getNotasFiscaisSaida({ numero_nf: query, limit: 5 }),
      ]);

      const results: SearchResult[] = [];

      if (pedidosRes.status === 'fulfilled') {
        (pedidosRes.value.pedidos_vendas ?? []).forEach((pedido) => {
          results.push({
            type: 'pedido',
            numero: pedido.numero_pedido ?? query,
            vendedorCodigo: pedido.codigo_vendedor_omie,
            vendedorNome: vendedorLabel(pedido.codigo_vendedor_omie),
            empresaNome: empresaLabel(pedido.codigo_empresa),
            empresaId: pedido.codigo_empresa,
            valor: Number(pedido.valor_total_pedido) || 0,
            data: pedido.data_inclusao,
            status: pedido.situacao ?? '—',
          });
        });
      } else {
        console.error(pedidosRes.reason);
      }

      if (notasRes.status === 'fulfilled') {
        (notasRes.value.nota_fiscal_saida ?? []).forEach((nf) => {
          results.push({
            type: 'nf',
            numero: nf.numero_nf ?? query,
            vendedorCodigo: nf.codigo_vendedor_omie,
            vendedorNome: vendedorLabel(nf.codigo_vendedor_omie),
            empresaNome: empresaLabel(nf.codigo_empresa),
            empresaId: nf.codigo_empresa,
            valor: Number(nf.valor_nf) || 0,
            data: nf.data_emissao,
            status: nf.averbado ? 'Averbada' : 'Não averbada',
          });
        });
      } else {
        console.error(notasRes.reason);
      }

      setSearchResults(results);
      if (results.length === 0) {
        notify.error(`Nenhum pedido ou nota encontrado com o número "${query}"`);
      }
    } catch (error) {
      console.error(error);
      notify.error('Erro ao buscar pedido/nota');
    } finally {
      setSearching(false);
    }
  };

  // Achar "onde está" de verdade: ajusta mês/empresa pro registro encontrado,
  // pede pro dashboard certo abrir o modal do vendedor (navegando pra lá se
  // necessário — "por tipo" não tem ranking/modal próprio, então pedido e NF
  // sempre abrem no dashboard base de Vendas/Faturamento) e o modal mostra o
  // pedido/nota junto com o resto do vendedor naquele mês.
  const handleResultClick = (result: SearchResult) => {
    if (result.data) setCompleteDate(dayjs(result.data));
    if (result.empresaId) setCodigoEmpresa(result.empresaId);

    const dashboard = result.type === 'pedido' ? 'vendas' : 'faturamento';
    const targetPath = `/dashboards/dash-${dashboard}`;

    requestVendorModal({
      dashboard,
      vendorId: Number(result.vendedorCodigo),
      filialId: result.empresaId,
    });

    if (pathname !== targetPath) {
      router.push(targetPath);
    }

    setIsOpenSearch(false);
    setSearchQuery('');
    setSearchResults(null);
  };

  return (
    <header className={`${styles.header} ${visible ? styles.visible : styles.hidden}`}>
      <button
        className={`${styles.actionButton} ${styles.mobileMenuButton}`}
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Abrir menu"
      >
        <GiHamburgerMenu />
      </button>
      {status === 'authenticated' && (
        <div className={styles.buttonsContainer}>
          <button
            className={`${styles.actionButton} ${isHistorico && styles.active}`}
            onClick={handleHistoric}
            aria-label="Dados históricos"
          >
            <MdOutlineHistory />
          </button>
          {showOrderSearch && (
            <div className={styles.datePickerContainer} ref={searchFilters}>
              <button
                className={styles.actionButton}
                onClick={() => setIsOpenSearch((prev) => !prev)}
                aria-label="Buscar pedido de venda ou nota fiscal"
                title="Buscar pedido/NF"
              >
                <MdSearch />
              </button>
              {isOpenSearch && (
                <div className={styles.datePickerMenu}>
                  <div className={`${styles.datePickerCard} ${styles.searchCard}`}>
                    <form className={styles.searchForm} onSubmit={handleSearch}>
                      <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Nº do pedido ou da NF"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className={styles.searchSubmitBtn}
                        disabled={searching || !searchQuery.trim()}
                        aria-label="Buscar"
                      >
                        <MdSearch />
                      </button>
                    </form>
                    {searchResults && (
                      <div className={styles.searchResults}>
                        {searchResults.length === 0 ? (
                          <p className={styles.searchEmpty}>Nada encontrado com esse número.</p>
                        ) : (
                          searchResults.map((result, index) => (
                            <button
                              key={`${result.type}-${result.numero}-${index}`}
                              type="button"
                              className={styles.searchResultItem}
                              onClick={() => handleResultClick(result)}
                            >
                              <div className={styles.searchResultHead}>
                                <span className={styles.searchResultBadge}>
                                  {result.type === 'pedido' ? 'Pedido' : 'NF'}
                                </span>
                                <span>#{result.numero}</span>
                                <span className={styles.searchResultDate}>
                                  {result.data ? dayjs(result.data).format('DD/MM/YYYY') : '—'}
                                </span>
                              </div>
                              <div className={styles.searchResultRow}>
                                <span>Vendedor</span>
                                <strong>{result.vendedorNome}</strong>
                              </div>
                              <div className={styles.searchResultRow}>
                                <span>Empresa</span>
                                <strong>{result.empresaNome}</strong>
                              </div>
                              <div className={styles.searchResultRow}>
                                <span>Valor</span>
                                <strong>{toBRL(result.valor)}</strong>
                              </div>
                              <div className={styles.searchResultRow}>
                                <span>Situação</span>
                                <strong>{result.status}</strong>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={styles.datePickerContainer} ref={empresaFilters}>
            <button
              className={`${styles.actionButton} ${codigoEmpresa && styles.active}`}
              onClick={handleEmpresaPicker}
              aria-label={
                empresaSelecionada
                  ? `Filtrando por ${empresaSelecionada.nome_fantasia} — clique para escolher outra empresa`
                  : 'Mostrando todas as empresas — clique para filtrar por uma unidade'
              }
              title="Empresa"
            >
              <MdBusiness />
            </button>
            {isOpenEmpresaPicker && (
              <div className={styles.datePickerMenu}>
                <div className={`${styles.datePickerCard} ${styles.empresaOptionsList}`}>
                  <button
                    type="button"
                    className={`${styles.empresaOption} ${!codigoEmpresa && styles.empresaOptionActive}`}
                    onClick={() => handleSelectEmpresa(null)}
                  >
                    Todas as empresas
                  </button>
                  {unidades.map((unidade) => (
                    <button
                      key={unidade.id}
                      type="button"
                      className={`${styles.empresaOption} ${codigoEmpresa === unidade.id && styles.empresaOptionActive}`}
                      onClick={() => handleSelectEmpresa(unidade.id)}
                    >
                      {unidade.nome_fantasia}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className={`${styles.datePickerContainer}`} ref={dateFilters}>
            <button
              className={`${styles.actionButton}`}
              onClick={handleDatePicker}
              aria-label="Filtros de data"
            >
              <FaRegCalendarAlt />
            </button>
            {isOpenDatePicker && (
              <div className={styles.datePickerMenu}>
                <div className={styles.datePickerCard}>
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="pt-br"
                    localeText={ptBR.components.MuiLocalizationProvider.defaultProps.localeText}
                  >
                    <DateCalendar
                      openTo="month"
                      views={['year', 'month']}
                      minDate={dayjs('2026-01-01')}
                      maxDate={dayjs()}
                      value={completeDate}
                      onChange={(value) => {
                        if (!value) return;
                        setCompleteDate(value);
                        setIsOpenDatePicker(false);
                      }}
                      yearsOrder="desc"
                      sx={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        maxHeight: '280px',
                        color: 'var(--foreground)',
                        '& .MuiPickersCalendarHeader-label': {
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                        },
                        '& .MuiPickersArrowSwitcher-button': {
                          color: 'var(--foreground)',
                          '&:hover': { backgroundColor: 'var(--surface-secondary)' },
                        },
                        '& .MuiPickersYear-yearButton': {
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                          '&.Mui-selected': {
                            backgroundColor: 'var(--primary-button-bg)',
                            color: 'var(--primary-button-fg)',
                          },
                          '&:hover': { backgroundColor: 'var(--surface-secondary)' },
                        },
                        '& .MuiPickersMonth-monthButton': {
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                          '&.Mui-selected': {
                            backgroundColor: 'var(--primary-button-bg)',
                            color: 'var(--primary-button-fg)',
                          },
                          '&:hover': { backgroundColor: 'var(--surface-secondary)' },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>
            )}
          </div>
          <button
            className={styles.actionButton}
            onClick={() => setFullscreen(!fullscreen)}
            aria-label="Alternar Tela cheia"
          >
            {fullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
          </button>
          <ThemeToggle />
        </div>
      )}
    </header>
  );
};

export default OverlayHeader;
