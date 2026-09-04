'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Autocomplete, Chip, CircularProgress, MenuItem, Select, TextField } from '@mui/material';
import { FaPlus } from 'react-icons/fa';
import styles from './styles.module.css';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import {
  getUnidades,
  criarUnidade,
  editarUnidade,
  deletarUnidade,
} from '@/services/cadastros/auxiliares/unidades';
import { FormUnidade, TIPOS_UNIDADE, UnidadeProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import PhotoUpload from '@/components/Ui/PhotoUpload/PhotoUpload';
import { UFS } from '@/utils/consts';

const FORM_INICIAL: FormUnidade = {
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  tipo_unidade: 'matriz',
  matriz_id: '',
  cor_unidade: '#64748b',
  foto_url: '',
  nome_contato: '',
  email: '',
  telefone: '',
  celular: '',
  homepage: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  latitude_y: '',
  longitude_x: '',
  ordem_exibicao: '',
};

const tipoLabel = (tipo: string) => TIPOS_UNIDADE.find((t) => t.value === tipo)?.label ?? tipo;

const SECOES_FORM = [
  { id: 'identificacao', label: 'Identificação' },
  { id: 'contato', label: 'Contato' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'geo', label: 'Geolocalização' },
];

function Campo({
  label,
  required,
  flex,
  minWidth,
  children,
}: {
  label: string;
  required?: boolean;
  flex?: number;
  minWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field} style={{ flex, minWidth }}>
      <label className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.fieldRequired}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function Unidades() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<UnidadeProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [matrizes, setMatrizes] = useState<UnidadeProps[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);
  const [tipoFiltro, setTipoFiltro] = useState('');

  const [form, setForm] = useState<FormUnidade>(FORM_INICIAL);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);

  const [activeSecao, setActiveSecao] = useState(SECOES_FORM[0].id);
  const formBodyRef = useRef<HTMLDivElement>(null);
  const secaoRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!isModalOpen) return;
    const root = formBodyRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visiveis = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visiveis[0]) {
          setActiveSecao(visiveis[0].target.id.replace('secao-', ''));
        }
      },
      { root, threshold: 0.1, rootMargin: '0px 0px -35% 0px' }
    );

    Object.values(secaoRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isModalOpen]);

  const irParaSecao = (id: string) => {
    secaoRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const secaoCompleta: Record<string, boolean> = {
    identificacao: !!(
      form.cnpj.trim() &&
      form.tipo_unidade &&
      form.nome_fantasia.trim() &&
      form.razao_social.trim()
    ),
    contato: !!(form.nome_contato.trim() && form.email.trim() && form.telefone.trim()),
    endereco: !!(
      form.cep.trim() &&
      form.logradouro.trim() &&
      form.numero.trim() &&
      form.bairro.trim() &&
      form.cidade.trim() &&
      form.estado
    ),
    geo: true,
  };
  const secoesCompletas = Object.values(secaoCompleta).filter(Boolean).length;

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadMatrizes() {
      try {
        const data = await getUnidades({ tipo_unidade: 'matriz', limit: 500 });
        setMatrizes(data.unidades ?? []);
      } catch {
        notify.error('Erro ao carregar unidades matrizes');
      }
    }
    loadMatrizes();
  }, [refreshTrigger]);

  useEffect(() => {
    async function fetchUnidades() {
      try {
        setLoading(true);
        const isCnpjQuery = /\d/.test(search);
        const response = await getUnidades({
          page: page + 1,
          limit: rowsPerPage,
          nome_fantasia: !isCnpjQuery && search ? search : undefined,
          cnpj: isCnpjQuery && search ? search : undefined,
          tipo_unidade: tipoFiltro || undefined,
        });
        setRows(response.unidades ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar unidades');
      } finally {
        setLoading(false);
      }
    }
    fetchUnidades();
  }, [page, rowsPerPage, search, tipoFiltro, refreshTrigger]);

  const matrizLabel = (id: string) => {
    const found = matrizes.find((m) => m.id === id);
    return found ? found.nome_fantasia : '—';
  };

  const FILTROS_UNIDADE = [
    {
      key: 'tipo',
      label: 'Tipo',
      options: TIPOS_UNIDADE.map((tipo) => ({ value: tipo.value, label: tipo.label })),
    },
  ];

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setFotoPreviewUrl(null);
    setActiveSecao(SECOES_FORM[0].id);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (unidade: UnidadeProps) => {
    setEditingId(unidade.id);
    setFotoPreviewUrl(unidade.foto_signed_url ?? null);
    setActiveSecao(SECOES_FORM[0].id);
    setForm({
      cnpj: unidade.cnpj,
      razao_social: unidade.razao_social,
      nome_fantasia: unidade.nome_fantasia,
      tipo_unidade: unidade.tipo_unidade,
      matriz_id: unidade.matriz_id ?? '',
      cor_unidade: unidade.cor_unidade ?? '#64748b',
      foto_url: unidade.foto_url ?? '',
      nome_contato: unidade.nome_contato ?? '',
      email: unidade.email ?? '',
      telefone: unidade.telefone ?? '',
      celular: unidade.celular ?? '',
      homepage: unidade.homepage ?? '',
      logradouro: unidade.logradouro ?? '',
      numero: unidade.numero ?? '',
      complemento: unidade.complemento ?? '',
      bairro: unidade.bairro ?? '',
      cidade: unidade.cidade ?? '',
      estado: unidade.estado ?? '',
      cep: unidade.cep ?? '',
      latitude_y: unidade.latitude_y ?? '',
      longitude_x: unidade.longitude_x ?? '',
      ordem_exibicao: unidade.ordem_exibicao != null ? String(unidade.ordem_exibicao) : '',
    });
    setIsModalOpen(true);
  };

  const salvarUnidade = async () => {
    if (!form.cnpj.trim()) {
      notify.error('CNPJ é obrigatório');
      return;
    }
    if (!form.nome_fantasia.trim()) {
      notify.error('Nome fantasia é obrigatório');
      return;
    }
    if (!form.razao_social.trim()) {
      notify.error('Razão social é obrigatória');
      return;
    }
    if (form.tipo_unidade === 'filial' && !form.matriz_id) {
      notify.error('Selecione a matriz da filial');
      return;
    }
    const camposObrigatorios: [keyof FormUnidade, string][] = [
      ['nome_contato', 'Nome do contato é obrigatório'],
      ['email', 'Email é obrigatório'],
      ['telefone', 'Telefone é obrigatório'],
      ['logradouro', 'Logradouro é obrigatório'],
      ['numero', 'Número é obrigatório'],
      ['bairro', 'Bairro é obrigatório'],
      ['cidade', 'Cidade é obrigatória'],
      ['estado', 'UF é obrigatória'],
      ['cep', 'CEP é obrigatório'],
    ];
    for (const [campo, mensagem] of camposObrigatorios) {
      if (!form[campo].trim()) {
        notify.error(mensagem);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        cnpj: form.cnpj.trim(),
        nome_fantasia: form.nome_fantasia.trim(),
        razao_social: form.razao_social.trim(),
        tipo_unidade: form.tipo_unidade,
        matriz_id: form.tipo_unidade === 'filial' ? form.matriz_id || null : null,
        cor_unidade: form.cor_unidade || null,
        foto_url: form.foto_url || null,
        nome_contato: form.nome_contato.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        celular: form.celular.trim() || null,
        homepage: form.homepage.trim() || null,
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado,
        cep: form.cep.trim(),
        latitude_y: form.latitude_y.trim() || null,
        longitude_x: form.longitude_x.trim() || null,
        ordem_exibicao: form.ordem_exibicao.trim() ? Number(form.ordem_exibicao) : null,
      };

      if (editingId) {
        await editarUnidade(editingId, payload);
        notify.success('Unidade atualizada com sucesso');
      } else {
        await criarUnidade(payload);
        notify.success('Unidade cadastrada com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar unidade' : 'Erro ao cadastrar unidade');
    } finally {
      setSaving(false);
    }
  };

  const excluirUnidade = async () => {
    if (!editingId) return;
    try {
      await deletarUnidade(editingId);
      notify.success('Unidade excluída com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir unidade');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirUnidade,
    message: 'Tem certeza que deseja excluir a unidade? Esta ação não pode ser desfeita.',
    title: 'Excluir Unidade',
  });

  const setField = <K extends keyof FormUnidade>(field: K, value: FormUnidade[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Unidades" subtitle="Gerencie as unidades cadastradas no sistema" />
        {can('pode_criar') && (
          <Button variant="primary" icon={<FaPlus size={14} />} onClick={abrirCriacaoModal}>
            Novo
          </Button>
        )}
      </div>
      <PageContent>
        <div className={styles.tableCard}>
          <SearchFilterBar
            searchValue={searchInput}
            onSearchChange={(value) => {
              setSearchInput(value);
              setPage(0);
            }}
            searchPlaceholder="Buscar por nome ou CNPJ..."
            filters={FILTROS_UNIDADE}
            activeValues={{ tipo: tipoFiltro || undefined }}
            onFilterChange={(key, value) => {
              if (key === 'tipo') {
                setTipoFiltro(value ?? '');
                setPage(0);
              }
            }}
            glass
          />
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <>
            <div className={styles.tableWrapper}>
            <TableContainer
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {['Nome Fantasia', 'CNPJ', 'Tipo', 'Matriz', 'Cidade/UF', 'Telefone'].map((label) => (
                      <TableCell
                        key={label}
                        sx={{
                          background:
                            'linear-gradient(180deg, color-mix(in srgb, var(--foreground) 6%, transparent), color-mix(in srgb, var(--foreground) 1.5%, transparent))',
                          borderBottom: '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)',
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      hover={can('pode_editar')}
                      key={row.id}
                      onClick={can('pode_editar') ? () => abrirEdicaoModal(row) : undefined}
                      sx={{
                        cursor: can('pode_editar') ? 'pointer' : 'default',
                        '& .MuiTableCell-root': {
                          borderBottom: '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                        },
                      }}
                    >
                      <TableCell>
                        <div className={styles.avatarCell}>
                          {row.foto_signed_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.foto_signed_url} alt="" className={styles.avatarThumb} />
                          ) : (
                            <div className={styles.avatarThumbPlaceholder} />
                          )}
                          <span
                            style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: row.cor_unidade ?? 'var(--border-strong)',
                              marginRight: 8,
                            }}
                          />
                          {row.nome_fantasia}
                        </div>
                      </TableCell>
                      <TableCell>{row.cnpj ? row.cnpj : '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={tipoLabel(row.tipo_unidade)}
                          color={row.tipo_unidade === 'matriz' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.matriz_id ? matrizLabel(row.matriz_id) : '—'}</TableCell>
                      <TableCell>{row.cidade ? `${row.cidade}` : '—'}</TableCell>
                      <TableCell>{row.telefone ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </div>
            <MobileCardList
              rows={rows}
              getRowKey={(row) => row.id}
              emptyMessage="Nenhuma unidade encontrada."
              onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
              renderTitle={(row) => (
                <div className={styles.avatarCell}>
                  {row.foto_signed_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.foto_signed_url} alt="" className={styles.avatarThumb} />
                  ) : (
                    <div className={styles.avatarThumbPlaceholder} />
                  )}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: row.cor_unidade ?? 'var(--border-strong)',
                      marginRight: 8,
                    }}
                  />
                  {row.nome_fantasia}
                </div>
              )}
              renderSubtitle={(row) => (row.cnpj ? row.cnpj : '—')}
              renderBadge={(row) => (
                <Chip
                  label={tipoLabel(row.tipo_unidade)}
                  color={row.tipo_unidade === 'matriz' ? 'warning' : 'default'}
                  size="small"
                />
              )}
              fields={(row) => [
                { label: 'Matriz', value: row.matriz_id ? matrizLabel(row.matriz_id) : '—' },
                { label: 'Cidade/UF', value: row.cidade ? `${row.cidade}` : '—' },
                { label: 'Telefone', value: row.telefone ?? '—' },
              ]}
            />
            </>
          )}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            count={rowCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={setPage}
            onRowsPerPageChange={(rpp) => {
              setRowsPerPage(rpp);
              setPage(0);
            }}
          />
        </div>
      </PageContent>
    </div>

      <Modal
        title={editingId ? 'Editar Unidade' : 'Nova Unidade'}
        subtitle={editingId ? form.nome_fantasia : 'Preencha os dados da nova unidade'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModalWrap}>
        <div className={styles.formModalNav}>
        <nav className={styles.formNav}>
          {SECOES_FORM.map((secao) => (
            <button
              key={secao.id}
              type="button"
              className={clsx(
                styles.navItem,
                activeSecao === secao.id && styles.navItemActive,
                activeSecao !== secao.id && secaoCompleta[secao.id] && styles.navItemDone
              )}
              onClick={() => irParaSecao(secao.id)}
            >
              <span className={styles.navDot} />
              {secao.label}
            </button>
          ))}
          <p className={styles.navFooter}>
            {secoesCompletas} de {SECOES_FORM.length} seções completas
          </p>
        </nav>
        <div className={styles.formNavBody} ref={formBodyRef}>
        <div className={styles.formModal}>
          {/* Identificação */}
          <section
            id="secao-identificacao"
            className={styles.formSection}
            ref={(el) => {
              secaoRefs.current.identificacao = el;
            }}
          >
          <p className={styles.sectionTitle}>Identificação</p>
          <div className={styles.formRow}>
            <PhotoUpload
              label="Foto/Logo"
              bucket="empresa"
              shape="rounded"
              previewUrl={fotoPreviewUrl}
              onChange={(key, url) => {
                setField('foto_url', key);
                setFotoPreviewUrl(url);
              }}
            />
          </div>
          <div className={styles.formRow}>
            <Campo label="CNPJ" required flex={1} minWidth={200}>
              <TextField
                sx={{ width: '100%' }}
                value={form.cnpj}
                onChange={(e) => setField('cnpj', e.target.value)}
                placeholder="12.345.678/0001-99"
              />
            </Campo>
            <Campo label="Tipo" required minWidth={160}>
              <Select
                sx={{ width: '100%' }}
                value={form.tipo_unidade}
                onChange={(e) => setField('tipo_unidade', e.target.value)}
              >
                {TIPOS_UNIDADE.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </Select>
            </Campo>
            {form.tipo_unidade === 'filial' && (
              <Campo label="Matriz" required flex={1} minWidth={220}>
                <Autocomplete
                  sx={{ width: '100%' }}
                  options={matrizes.filter((m) => m.id !== editingId)}
                  getOptionKey={(m) => m.id}
                  getOptionLabel={(m) => m.nome_fantasia}
                  value={matrizes.find((m) => m.id === form.matriz_id) ?? null}
                  onChange={(_, v) => setField('matriz_id', v?.id ?? '')}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => <TextField {...params} placeholder="Selecione a matriz" />}
                />
              </Campo>
            )}
          </div>
          <div className={styles.formRow}>
            <Campo label="Nome Fantasia" required flex={1} minWidth={220}>
              <TextField
                sx={{ width: '100%' }}
                value={form.nome_fantasia}
                onChange={(e) => setField('nome_fantasia', e.target.value)}
                placeholder="Ex: Aços Vital Matriz"
              />
            </Campo>
            <Campo label="Razão Social" required flex={1} minWidth={220}>
              <TextField
                sx={{ width: '100%' }}
                value={form.razao_social}
                onChange={(e) => setField('razao_social', e.target.value)}
                placeholder="Ex: Aços Vital Ltda"
              />
            </Campo>
            <Campo label="Ordem de Exibição" minWidth={140}>
              <TextField
                sx={{ width: '100%' }}
                type="number"
                value={form.ordem_exibicao}
                onChange={(e) => setField('ordem_exibicao', e.target.value)}
              />
            </Campo>
            <Campo label="Cor" minWidth={100}>
              <TextField
                sx={{ width: '100%' }}
                type="color"
                value={form.cor_unidade}
                onChange={(e) => setField('cor_unidade', e.target.value)}
              />
            </Campo>
          </div>
          </section>

          {/* Contato */}
          <section
            id="secao-contato"
            className={styles.formSection}
            ref={(el) => {
              secaoRefs.current.contato = el;
            }}
          >
          <p className={styles.sectionTitle}>Contato</p>
          <div className={styles.formRow}>
            <Campo label="Nome do Contato" required flex={1} minWidth={200}>
              <TextField
                sx={{ width: '100%' }}
                value={form.nome_contato}
                onChange={(e) => setField('nome_contato', e.target.value)}
              />
            </Campo>
            <Campo label="Email" required flex={1} minWidth={220}>
              <TextField
                sx={{ width: '100%' }}
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </Campo>
            <Campo label="Telefone" required flex={1} minWidth={160}>
              <TextField
                sx={{ width: '100%' }}
                value={form.telefone}
                onChange={(e) => setField('telefone', e.target.value)}
                placeholder="(11) 3333-4444"
              />
            </Campo>
            <Campo label="Celular" flex={1} minWidth={160}>
              <TextField
                sx={{ width: '100%' }}
                value={form.celular}
                onChange={(e) => setField('celular', e.target.value)}
                placeholder="(11) 99999-8888"
              />
            </Campo>
            <Campo label="Homepage" flex={1} minWidth={200}>
              <TextField
                sx={{ width: '100%' }}
                value={form.homepage}
                onChange={(e) => setField('homepage', e.target.value)}
              />
            </Campo>
          </div>
          </section>

          {/* Endereço */}
          <section
            id="secao-endereco"
            className={styles.formSection}
            ref={(el) => {
              secaoRefs.current.endereco = el;
            }}
          >
          <p className={styles.sectionTitle}>Endereço</p>
          <div className={styles.formRow}>
            <Campo label="CEP" required minWidth={140}>
              <TextField
                sx={{ width: '100%' }}
                value={form.cep}
                onChange={(e) => setField('cep', e.target.value)}
                placeholder="01310-100"
              />
            </Campo>
            <Campo label="Logradouro" required flex={1} minWidth={220}>
              <TextField
                sx={{ width: '100%' }}
                value={form.logradouro}
                onChange={(e) => setField('logradouro', e.target.value)}
              />
            </Campo>
            <Campo label="Número" required minWidth={100}>
              <TextField
                sx={{ width: '100%' }}
                value={form.numero}
                onChange={(e) => setField('numero', e.target.value)}
              />
            </Campo>
            <Campo label="Complemento" flex={1} minWidth={160}>
              <TextField
                sx={{ width: '100%' }}
                value={form.complemento}
                onChange={(e) => setField('complemento', e.target.value)}
              />
            </Campo>
          </div>
          <div className={styles.formRow}>
            <Campo label="Bairro" required flex={1} minWidth={180}>
              <TextField
                sx={{ width: '100%' }}
                value={form.bairro}
                onChange={(e) => setField('bairro', e.target.value)}
              />
            </Campo>
            <Campo label="Cidade" required flex={1} minWidth={180}>
              <TextField
                sx={{ width: '100%' }}
                value={form.cidade}
                onChange={(e) => setField('cidade', e.target.value)}
              />
            </Campo>
            <Campo label="UF" required minWidth={120}>
              <Select
                sx={{ width: '100%' }}
                value={form.estado}
                onChange={(e) => setField('estado', e.target.value)}
              >
                {UFS.map((uf) => (
                  <MenuItem key={uf} value={uf}>
                    {uf}
                  </MenuItem>
                ))}
              </Select>
            </Campo>
          </div>
          </section>

          {/* Geolocalização */}
          <section
            id="secao-geo"
            className={styles.formSection}
            ref={(el) => {
              secaoRefs.current.geo = el;
            }}
          >
          <p className={styles.sectionTitle}>Geolocalização</p>
          <div className={styles.formRow}>
            <Campo label="Latitude" flex={1} minWidth={160}>
              <TextField
                sx={{ width: '100%' }}
                value={form.latitude_y}
                onChange={(e) => setField('latitude_y', e.target.value)}
                placeholder="Ex: -23.5505"
                slotProps={{ htmlInput: { maxLength: 20 } }}
              />
            </Campo>
            <Campo label="Longitude" flex={1} minWidth={160}>
              <TextField
                sx={{ width: '100%' }}
                value={form.longitude_x}
                onChange={(e) => setField('longitude_x', e.target.value)}
                placeholder="Ex: -46.6333"
                slotProps={{ htmlInput: { maxLength: 20 } }}
              />
            </Campo>
          </div>
          </section>
        </div>
        </div>
        </div>

        <div
          className={
            editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
          }
        >
          {editingId && (
            <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
              Excluir Unidade
            </PermissionButton>
          )}
          <div className={styles.formActionsMain}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <PermissionButton
              acao={editingId ? 'pode_editar' : 'pode_criar'}
              variant="primary"
              onClick={salvarUnidade}
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Unidade'}
            </PermissionButton>
          </div>
        </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
