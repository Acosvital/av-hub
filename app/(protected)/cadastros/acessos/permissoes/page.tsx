'use client';

import { useEffect, useState, useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Chip, CircularProgress, TextField } from '@mui/material';
import styles from './styles.module.css';
import Card from '@/components/Ui/Card/Card';
import Button from '@/components/Ui/Button/Button';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { getPerfis } from '@/services/cadastros/acessos/perfis';
import { getTelas } from '@/services/cadastros/acessos/telas';
import { getPermissoes, criarPermissoesBulk } from '@/services/cadastros/acessos/permissoes';
import { TelaProps } from '../telas/types';
import { usePermission } from '@/hooks/usePermission';
import BulkPermissaoModal, { BulkPayload } from './BulkPermissaoModal';

interface PerfilRef {
  id: string;
  nome: string;
}

export default function Permissoes() {
  const [loading, setLoading] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [allPerfis, setAllPerfis] = useState<PerfilRef[]>([]);
  const [allTelas, setAllTelas] = useState<TelaProps[]>([]);
  const [permissoesPorPerfil, setPermissoesPorPerfil] = useState<Record<string, number>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filtroNome, setFiltroNome] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilRef | null>(null);

  const { can } = usePermission();

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [perfisRes, telasRes] = await Promise.all([
          getPerfis({ limit: 1000 }),
          getTelas({ limit: 1000 }),
        ]);
        setAllPerfis(perfisRes.perfis ?? []);
        setAllTelas(telasRes.menus ?? []);
      } catch (err) {
        console.error(err);
      }
    }
    loadReferenceData();
  }, []);

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        const res = await getPermissoes({ limit: 1000 });
        const summary: Record<string, number> = {};
        (res.permissoes ?? []).forEach((p) => {
          summary[p.id_perfil] = (summary[p.id_perfil] ?? 0) + 1;
        });
        setPermissoesPorPerfil(summary);
      } catch (err) {
        console.error(err);
        notify.error('Erro ao carregar permissões');
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [refreshTrigger]);

  const perfisFiltrados = useMemo(
    () => allPerfis.filter((p) => p.nome.toLowerCase().includes(filtroNome.toLowerCase())),
    [allPerfis, filtroNome]
  );

  const perfisPaginados = useMemo(
    () => perfisFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [perfisFiltrados, page, rowsPerPage]
  );

  const handlePerfilClick = (perfil: PerfilRef) => {
    setSelectedPerfil(perfil);
    setIsBulkModalOpen(true);
  };

  const salvarPermissoesBulk = async (payload: BulkPayload) => {
    try {
      setBulkSaving(true);
      await criarPermissoesBulk(payload);
      notify.success('Permissões atualizadas com sucesso');
      setIsBulkModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      notify.error('Erro ao salvar permissões');
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Permissões"
        subtitle="Gerencie as permissões de acesso dos perfis às telas do sistema"
      />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              label="Buscar por perfil"
              value={filtroNome}
              onChange={(e) => {
                setFiltroNome(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ flex: 1, minWidth: 260 }}
            />
          </div>
          <div className={styles.cardButtons}>
            <Button
              variant="secondary"
              onClick={() => {
                setFiltroNome('');
                setPage(0);
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card title="Permissões por Perfil">
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Perfil</TableCell>
                    <TableCell>Telas Configuradas</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {perfisPaginados.map((perfil) => {
                    const count = permissoesPorPerfil[perfil.id] ?? 0;
                    return (
                      <TableRow
                        hover={can('pode_criar')}
                        key={perfil.id}
                        onClick={can('pode_criar') ? () => handlePerfilClick(perfil) : undefined}
                        sx={{ cursor: can('pode_criar') ? 'pointer' : 'default' }}
                      >
                        <TableCell>{perfil.nome}</TableCell>
                        <TableCell>{count > 0 ? `${count} tela(s)` : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={count > 0 ? 'Configurado' : 'Sem permissões'}
                            color={count > 0 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            sx={{ flexShrink: 0 }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={perfisFiltrados.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage="Resultados por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Card>
      </PageContent>

      <BulkPermissaoModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        allPerfis={allPerfis}
        allTelas={allTelas}
        onSave={salvarPermissoesBulk}
        saving={bulkSaving}
        initialPerfil={selectedPerfil}
      />
    </>
  );
}
