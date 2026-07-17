'use client';

import { useEffect, useMemo, useState } from 'react';
import { TextField, CircularProgress } from '@mui/material';
import styles from './styles.module.css';
import Card from '@/components/Ui/Card/Card';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { getCategorias } from '@/services/categoriasOrcamento';
import { getVinculos } from '@/services/vinculosOrcamento';
import { VinculoProps } from '../vinculos/types';
import { CategoriaResumoProps } from './types';
import normalizeText from '@/utils/normalizeText';

export default function Categorias() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [vinculos, setVinculos] = useState<VinculoProps[]>([]);
  const [buscaInput, setBuscaInput] = useState('');
  const busca = useDebounce(buscaInput, 300);

  useEffect(() => {
    error && notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [categoriasData, vinculosData] = await Promise.all([getCategorias(), getVinculos()]);
        setCategorias(categoriasData.categorias);
        setVinculos(vinculosData.vinculos);
      } catch (erro) {
        console.error(erro);
        setError('Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  const resumos: CategoriaResumoProps[] = useMemo(() => {
    const termo = normalizeText(busca);
    return categorias
      .filter((categoria) => !termo || normalizeText(categoria).includes(termo))
      .map((categoria) => {
        const doCategoria = vinculos.filter((v) => v.categoria === categoria);
        return {
          categoria,
          comCadastro: doCategoria.filter((v) => !v.sem_cadastro),
          semCadastro: doCategoria.filter((v) => v.sem_cadastro),
        };
      });
  }, [categorias, vinculos, busca]);

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle="Consulte a cobertura de fornecedores por categoria de produto"
      />
      <PageContent>
        <Card height="fit" title="Buscar categoria">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              label="Categoria"
              variant="outlined"
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
            />
          </div>
        </Card>
        <Card title="Categorias">
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <div className={styles.grid}>
              {resumos.map(({ categoria, comCadastro, semCadastro }) => (
                <div key={categoria} className={styles.card}>
                  <div className={styles.cardTitle}>{categoria}</div>
                  <div className={styles.meta}>
                    <span>{comCadastro.length} com cadastro</span>
                    {semCadastro.length > 0 && (
                      <span className={styles.metaWarning}>
                        {semCadastro.length} sem cadastro
                      </span>
                    )}
                  </div>
                  <div className={styles.chips}>
                    {comCadastro.map((v, i) => (
                      <span key={`ok-${i}`} className={styles.chip}>
                        {v.fornecedor}
                      </span>
                    ))}
                    {semCadastro.map((v, i) => (
                      <span key={`nf-${i}`} className={`${styles.chip} ${styles.chipWarning}`}>
                        {v.fornecedor}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageContent>
    </>
  );
}
