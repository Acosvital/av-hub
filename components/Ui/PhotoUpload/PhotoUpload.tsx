'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LuCamera, LuLoaderCircle, LuUser } from 'react-icons/lu';
import { notify } from '@/lib/toast/toast';
import styles from './PhotoUpload.module.css';

// Importante: NÃO importar nada além de tipos de 'react-filerobot-image-editor'
// no topo do módulo — o pacote arrasta o konva, que exige o binário nativo
// `canvas` ao ser avaliado durante o SSR do componente cliente. Por isso os
// IDs de tab/tool abaixo são strings literais, não os enums TABS/TOOLS do
// pacote (mesmo padrão do organograma_acosvital).
const FilerobotImageEditor = dynamic(() => import('react-filerobot-image-editor'), { ssr: false });
const ADJUST_TAB = 'Adjust' as const;
const FILTERS_TAB = 'Filters' as const;
const CROP_TOOL = 'Crop' as const;

// Repinta o chrome do editor (@scaleflex/ui) com os tokens de tema do HUB em
// vez do azul/branco default da lib — chaves são as strings literais do enum
// Color de @scaleflex/ui (não importado, mesmo motivo do comentário acima).
// Usar var(--token) em vez de valores fixos também acompanha a troca de
// tema claro/escuro do próprio app automaticamente.
const EDITOR_THEME = {
  palette: {
    'txt-primary': 'var(--foreground)',
    'txt-secondary': 'var(--foreground-secondary)',
    'txt-placeholder': 'var(--foreground-secondary)',
    // --av-accent é escuro demais pra usar como TEXTO/ícone direto sobre o
    // fundo navy (é pensado pra fundo de botão, com texto branco em cima) —
    // --orange-light é a mesma família de cor, com contraste legível aqui.
    'accent-primary': 'var(--orange-light)',
    'accent-primary-hover': 'var(--orange)',
    'accent-primary-active': 'var(--orange)',
    'accent-primary-disabled': 'var(--surface-secondary)',
    'accent-secondary-disabled': 'var(--card-bg-secondary)',
    // O botão "Save" e outros CTAs primários usam accent-stateless, não
    // accent-primary — sem essa chave ele ficava preso no azul default da
    // lib mesmo com o resto do tema já trocado.
    'accent-stateless': 'var(--av-accent)',
    'accent-stateless_0_4_opacity': 'color-mix(in srgb, var(--av-accent) 40%, transparent)',
    'accent_0_5_opacity': 'color-mix(in srgb, var(--av-accent) 5%, transparent)',
    'accent_1_2_opacity': 'color-mix(in srgb, var(--av-accent) 12%, transparent)',
    'accent_1_8_opacity': 'color-mix(in srgb, var(--av-accent) 18%, transparent)',
    'accent_2_8_opacity': 'color-mix(in srgb, var(--av-accent) 28%, transparent)',
    'accent_4_0_opacity': 'color-mix(in srgb, var(--av-accent) 40%, transparent)',
    'bg-stateless': 'var(--card-bg)',
    'bg-primary': 'var(--card-bg)',
    'bg-primary-light': 'var(--card-bg-secondary)',
    'bg-primary-hover': 'var(--surface-secondary)',
    'bg-primary-active': 'var(--surface-secondary)',
    'bg-secondary': 'var(--card-bg-secondary)',
    'bg-hover': 'var(--surface-secondary)',
    'bg-active': 'var(--surface-secondary)',
    'bg-grey': 'var(--card-bg-secondary)',
    'icon-primary': 'var(--foreground-secondary)',
    'icons-secondary': 'var(--foreground-secondary)',
    'icons-primary-hover': 'var(--foreground)',
    'icons-secondary-hover': 'var(--foreground)',
    'icons-invert': 'var(--foreground)',
    'btn-primary-text': 'var(--primary-button-fg)',
    'btn-secondary-text': 'var(--foreground)',
    'borders-primary': 'var(--border)',
    'borders-secondary': 'var(--border)',
    'borders-strong': 'var(--border-strong)',
    'borders-item': 'var(--border)',
    error: 'var(--danger)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    info: 'var(--info)',
    // Fade nas bordas das tiras com scroll horizontal (ex.: galeria de
    // filtros) — a lib cravava um gradiente branco fixo aqui, que sobrava
    // como uma mancha clara em cima do fundo escuro.
    'gradient-right':
      'linear-gradient(270deg, var(--card-bg) 1.56%, color-mix(in srgb, var(--card-bg) 89%, transparent) 52.4%, color-mix(in srgb, var(--card-bg) 53%, transparent) 76.04%, transparent 100%)',
    'gradient-right-active':
      'linear-gradient(270deg, var(--card-bg-secondary) 1.56%, var(--card-bg-secondary) 52.4%, color-mix(in srgb, var(--card-bg-secondary) 53%, transparent) 76.04%, transparent 100%)',
    'gradient-right-hover':
      'linear-gradient(270deg, var(--surface-secondary) 1.56%, var(--surface-secondary) 52.4%, color-mix(in srgb, var(--surface-secondary) 53%, transparent) 76.04%, transparent 100%)',
  },
};

const MIME_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

// A lib exporta na qualidade fixa configurada (1 = máxima) sem checar o
// tamanho final — uma foto de câmera/celular recortada pode facilmente
// passar de 5MB nessa qualidade. Comprime só se precisar: reduz a
// qualidade JPEG em passos até caber no limite, sem mexer em fotos que já
// cabem. Redimensiona como último recurso se nem qualidade mínima bastar.
async function comprimirSeNecessario(blob: Blob, maxBytes: number): Promise<Blob> {
  if (blob.size <= maxBytes) return blob;

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  let { width, height } = bitmap;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;
  ctx.drawImage(bitmap, 0, 0);

  const toJpegBlob = (quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

  let menor = blob;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
      const candidato = await toJpegBlob(quality);
      if (!candidato) continue;
      if (candidato.size < menor.size) menor = candidato;
      if (candidato.size <= maxBytes) return candidato;
    }
    // Qualidade mínima ainda não coube — reduz as dimensões pela metade e
    // tenta de novo (só chega aqui com fotos bem grandes em resolução).
    width = Math.round(width * 0.7);
    height = Math.round(height * 0.7);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(bitmap, 0, 0, width, height);
  }
  return menor;
}

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
      const blobOriginal = await fetch(savedImageData.imageBase64).then((res) => res.blob());
      const blob = await comprimirSeNecessario(blobOriginal, TAMANHO_MAXIMO_BYTES);
      if (blob.size > TAMANHO_MAXIMO_BYTES) {
        notify.error('Não foi possível comprimir a imagem abaixo de 5MB — tente uma foto menor.');
        return;
      }
      const extensao = blob === blobOriginal ? (savedImageData.mimeType?.split('/')[1] ?? 'jpg') : 'jpg';
      const formData = new FormData();
      formData.append('bucket', bucket);
      formData.append('file', blob, `foto.${extensao}`);

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
            theme={EDITOR_THEME}
            // Sugere uma proporção inicial pelo shape, mas noPresets:false deixa
            // o usuário trocar (quadrado, 16:9, 4:3, livre etc.) — pedido
            // explícito de poder ajustar a proporção, não só o corte travado.
            Crop={{ ratio: shape === 'circle' ? 1 : 16 / 9, noPresets: false }}
            tabsIds={[ADJUST_TAB, FILTERS_TAB]}
            defaultTabId={ADJUST_TAB}
            defaultToolId={CROP_TOOL}
            defaultSavedImageType="jpeg"
            // Qualidade máxima por padrão — comprimir é uma escolha do
            // usuário no diálogo de salvar (slider "Quality"), não algo
            // aplicado automaticamente.
            defaultSavedImageQuality={1}
            avoidChangesNotSavedAlertOnLeave
            language="pt"
          />
        </div>
      )}
    </div>
  );
}
