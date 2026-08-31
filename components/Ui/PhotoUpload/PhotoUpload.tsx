'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LuCamera, LuLoaderCircle, LuUser } from 'react-icons/lu';
import { notify } from '@/lib/toast/toast';
import styles from './PhotoUpload.module.css';

const FilerobotImageEditor = dynamic(() => import('react-filerobot-image-editor'), { ssr: false });

const MIME_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

interface PhotoUploadProps {
  label: string;
  bucket: 'pessoas' | 'empresa';
  previewUrl?: string | null;
  onChange: (key: string, previewUrl: string) => void;
  shape?: 'circle' | 'rounded';
}

export default function PhotoUpload({
  label,
  bucket,
  previewUrl,
  onChange,
  shape = 'circle',
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const abrirSeletorDeArquivo = () => inputRef.current?.click();

  const aoSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!MIME_TYPES_PERMITIDOS.includes(file.type)) {
      notify.error('Formato não suportado — use JPG, PNG ou WebP');
      return;
    }
    if (file.size > TAMANHO_MAXIMO_BYTES) {
      notify.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setEditorSrc(URL.createObjectURL(file));
  };

  const fecharEditor = () => {
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);
  };

  const salvarImagemEditada = async (savedImageData: { imageBase64?: string; mimeType?: string }) => {
    if (!savedImageData.imageBase64) {
      fecharEditor();
      return;
    }
    try {
      setUploading(true);
      const blob = await fetch(savedImageData.imageBase64).then((res) => res.blob());
      const formData = new FormData();
      formData.append('bucket', bucket);
      formData.append('file', blob, `foto.${savedImageData.mimeType?.split('/')[1] ?? 'jpg'}`);

      const res = await fetch('/api/uploads', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Erro ao enviar imagem (status ${res.status})`);
      }
      const { key, url } = (await res.json()) as { key: string; url: string };
      onChange(key, url);
      notify.success('Foto atualizada');
    } catch (err) {
      console.error(err);
      notify.error(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
      fecharEditor();
    }
  };

  return (
    <div className={styles.container}>
      <span className={styles.label}>{label}</span>
      <div className={styles.avatarRow}>
        <div className={`${styles.avatar} ${shape === 'rounded' ? styles.avatarRounded : ''}`}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={label} className={styles.avatarImg} />
          ) : (
            <LuUser className={styles.avatarPlaceholder} />
          )}
          {uploading && (
            <div className={styles.avatarOverlay}>
              <LuLoaderCircle className={styles.spinner} />
            </div>
          )}
        </div>
        <button
          type="button"
          className={styles.uploadButton}
          onClick={abrirSeletorDeArquivo}
          disabled={uploading}
        >
          <LuCamera size={16} />
          {previewUrl ? 'Alterar foto' : 'Adicionar foto'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={MIME_TYPES_PERMITIDOS.join(',')}
          className={styles.hiddenInput}
          onChange={aoSelecionarArquivo}
        />
      </div>

      {editorSrc && (
        <div className={styles.editorOverlay}>
          <FilerobotImageEditor
            source={editorSrc}
            onSave={salvarImagemEditada}
            onClose={fecharEditor}
            closeAfterSave
            savingPixelRatio={1}
            previewPixelRatio={1}
            Crop={{ ratio: shape === 'circle' ? 1 : 16 / 9 }}
            defaultSavedImageType="jpeg"
          />
        </div>
      )}
    </div>
  );
}
