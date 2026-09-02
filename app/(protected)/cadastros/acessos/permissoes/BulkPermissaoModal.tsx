'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { MdExpandMore } from 'react-icons/md';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import { TelaProps } from '../telas/types';
import { getPermissoes } from '@/services/cadastros/acessos/permissoes';
import styles from './styles.module.css';

interface PerfilRef {
  id: string;
  nome: string;
}

type TelaPermissions = {
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
};

type PermField = keyof TelaPermissions;

interface TelaNode extends TelaProps {
  children: TelaNode[];
}

export interface BulkPayload {
  id_perfil: string;
  permissoes: Array<{ id_tela: string } & TelaPermissions>;
}

const DEFAULT_PERMS: TelaPermissions = {
  pode_visualizar: false,
  pode_criar: false,
  pode_editar: false,
  pode_deletar: false,
};

const PERM_LABELS: { field: PermField; label: string }[] = [
  { field: 'pode_visualizar', label: 'Visualizar' },
  { field: 'pode_criar', label: 'Criar' },
  { field: 'pode_editar', label: 'Editar' },
  { field: 'pode_deletar', label: 'Deletar' },
];

function buildTree(telas: TelaProps[]): TelaNode[] {
  const sorted = [...telas].sort((a, b) => a.ordem - b.ordem);
  const map = new Map<string, TelaNode>();
  sorted.forEach((t) => map.set(t.id, { ...t, children: [] }));
  const roots: TelaNode[] = [];
  sorted.forEach((t) => {
    if (!t.id_parent) {
      roots.push(map.get(t.id)!);
    } else {
      const parent = map.get(t.id_parent);
      if (parent) {
        parent.children.push(map.get(t.id)!);
      } else {
        roots.push(map.get(t.id)!);
      }
    }
  });
  return roots;
}

function collectIds(node: TelaNode): string[] {
  return [node.id, ...node.children.flatMap(collectIds)];
}

function initPermissions(telas: TelaProps[]): Record<string, TelaPermissions> {
  return Object.fromEntries(telas.map((t) => [t.id, { ...DEFAULT_PERMS }]));
}

interface TreeItemProps {
  node: TelaNode;
  permissions: Record<string, TelaPermissions>;
  onChange: (ids: string[], field: PermField, value: boolean) => void;
}

function TelaTreeItem({ node, permissions, onChange }: TreeItemProps) {
  const perms = permissions[node.id] ?? DEFAULT_PERMS;

  if (node.children.length === 0) {
    return (
      <div className={styles.telaLeafRow}>
        <span className={styles.telaLeafName}>{node.nome}</span>
        <div className={styles.telaPermSwitches}>
          {PERM_LABELS.map(({ field, label }) => (
            <FormControlLabel
              key={field}
              control={
                <Switch
                  size="small"
                  checked={perms[field]}
                  onChange={(e) => onChange([node.id], field, e.target.checked)}
                  color="warning"
                />
              }
              label={label}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--foreground)',
                },
                margin: 0,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Accordion
      disableGutters
      sx={{
        background: 'transparent',
        boxShadow: 'none',
        border: '1px solid var(--border-strong)',
        borderRadius: '6px !important',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={
          <MdExpandMore
            style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--fs-lg)' }}
          />
        }
        sx={{
          minHeight: '44px',
          '& .MuiAccordionSummary-content': {
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '6px 0',
          },
          '&:hover': {
            backgroundColor: 'var(--navy-200)',
          },
        }}
      >
        <span className={styles.accordionName}>{node.nome}</span>
        <div className={styles.telaPermSwitches} onClick={(e) => e.stopPropagation()}>
          {PERM_LABELS.map(({ field, label }) => (
            <FormControlLabel
              key={field}
              control={
                <Switch
                  size="small"
                  checked={perms[field]}
                  onChange={(e) => onChange(collectIds(node), field, e.target.checked)}
                  color="warning"
                />
              }
              label={label}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--foreground)',
                },
                margin: 0,
              }}
            />
          ))}
        </div>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          padding: '0 var(--space-3) var(--space-3)',
        }}
      >
        {node.children.map((child) => (
          <TelaTreeItem key={child.id} node={child} permissions={permissions} onChange={onChange} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

interface BulkPermissaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPerfis: PerfilRef[];
  allTelas: TelaProps[];
  onSave: (payload: BulkPayload) => Promise<void>;
  saving: boolean;
  initialPerfil?: PerfilRef | null;
}

export default function BulkPermissaoModal({
  isOpen,
  onClose,
  allPerfis,
  allTelas,
  onSave,
  saving,
  initialPerfil,
}: BulkPermissaoModalProps) {
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilRef | null>(null);
  const [permissions, setPermissions] = useState<Record<string, TelaPermissions>>({});
  const [loadingPerms, setLoadingPerms] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const base = initPermissions(allTelas);
    setPermissions(base);

    if (initialPerfil) {
      setPerfilSelecionado(initialPerfil);
      setLoadingPerms(true);
      getPermissoes({ id_perfil: initialPerfil.id, limit: 1000 })
        .then((res) => {
          setPermissions((prev) => {
            const next = { ...prev };
            (res.permissoes ?? []).forEach((p) => {
              if (next[p.id_tela] !== undefined) {
                next[p.id_tela] = {
                  pode_visualizar: p.pode_visualizar,
                  pode_criar: p.pode_criar,
                  pode_editar: p.pode_editar,
                  pode_deletar: p.pode_deletar,
                };
              }
            });
            return next;
          });
        })
        .catch(console.error)
        .finally(() => setLoadingPerms(false));
    } else {
      setPerfilSelecionado(null);
    }
  }, [isOpen, allTelas, initialPerfil]);

  const tree = useMemo(() => buildTree(allTelas), [allTelas]);

  const handlePerfilChange = async (perfil: PerfilRef | null) => {
    setPerfilSelecionado(perfil);
    if (!perfil) {
      setPermissions(initPermissions(allTelas));
      return;
    }

    setLoadingPerms(true);
    try {
      const res = await getPermissoes({ id_perfil: perfil.id, limit: 1000 });
      setPermissions((prev) => {
        const next = { ...prev };
        (res.permissoes ?? []).forEach((p) => {
          if (next[p.id_tela] !== undefined) {
            next[p.id_tela] = {
              pode_visualizar: p.pode_visualizar,
              pode_criar: p.pode_criar,
              pode_editar: p.pode_editar,
              pode_deletar: p.pode_deletar,
            };
          }
        });
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleChange = useCallback((ids: string[], field: PermField, value: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = { ...next[id], [field]: value };
      });
      return next;
    });
  }, []);

  const configuredCount = useMemo(
    () =>
      Object.values(permissions).filter(
        (p) => p.pode_visualizar || p.pode_criar || p.pode_editar || p.pode_deletar
      ).length,
    [permissions]
  );

  const handleSave = async () => {
    if (!perfilSelecionado || configuredCount === 0) return;
    const permissoes = Object.entries(permissions)
      .filter(([, p]) => p.pode_visualizar || p.pode_criar || p.pode_editar || p.pode_deletar)
      .map(([id_tela, p]) => ({ id_tela, ...p }));
    await onSave({ id_perfil: perfilSelecionado.id, permissoes });
  };

  return (
    <Modal
      title={initialPerfil ? `Permissões — ${initialPerfil.nome}` : 'Nova Permissão'}
      subtitle={
        initialPerfil
          ? 'Ative ou desative as permissões por tela. As alterações substituem as configurações anteriores.'
          : 'Selecione o perfil e configure as permissões por tela'
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className={styles.bulkFormModal}>
        {!initialPerfil && (
          <>
            <p className={styles.sectionTitle}>Perfil</p>
            <hr className={styles.divider} />
            <div className={styles.perfilRow}>
              <Autocomplete
                options={allPerfis}
                getOptionKey={(p) => p.id}
                getOptionLabel={(p) => p.nome}
                value={perfilSelecionado}
                onChange={(_, v) => handlePerfilChange(v)}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => (
                  <TextField {...params} label="Perfil *" variant="outlined" size="small" />
                )}
                sx={{ width: 360 }}
              />
              {loadingPerms && <CircularProgress size={20} sx={{ color: 'var(--av-accent)' }} />}
            </div>
          </>
        )}

        <div className={styles.sectionTitleRow}>
          <p className={styles.sectionTitle} style={{ margin: 0 }}>
            Telas
          </p>
          <div className={styles.sectionTitleRight}>
            {loadingPerms && <CircularProgress size={16} sx={{ color: 'var(--av-accent)' }} />}
            {configuredCount > 0 && (
              <span className={styles.configuredBadge}>
                {configuredCount} tela(s) configurada(s)
              </span>
            )}
          </div>
        </div>
        <hr className={styles.divider} />

        <div className={styles.telaTree}>
          {tree.length === 0 ? (
            <p className={styles.emptyTree}>Nenhuma tela encontrada</p>
          ) : (
            tree.map((node) => (
              <TelaTreeItem
                key={node.id}
                node={node}
                permissions={permissions}
                onChange={handleChange}
              />
            ))
          )}
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <PermissionButton
            acao="pode_criar"
            variant="primary"
            onClick={handleSave}
            disabled={saving || !perfilSelecionado || configuredCount === 0}
          >
            {saving
              ? 'Salvando...'
              : `Salvar Permissões${configuredCount > 0 ? ` (${configuredCount})` : ''}`}
          </PermissionButton>
        </div>
      </div>
    </Modal>
  );
}
