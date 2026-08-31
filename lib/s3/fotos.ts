import { randomUUID } from 'crypto';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getBucketName, S3Bucket } from './client';

const URL_ASSINADA_TTL_SEGUNDOS = 3600;

const EXTENSAO_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const MIME_TYPES_PERMITIDOS = Object.keys(EXTENSAO_POR_MIME);
export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

// O bucket 'pessoas' também é lido pelo Organograma (sistema legado), que
// guarda em photo_url o caminho do seu proxy de leitura autenticado, no
// formato "/api/fotos/uploads/<uuid>.<ext>" — e não uma key de S3 pura.
// Escrevemos nesse mesmo formato para que a foto cadastrada por um sistema
// apareça no outro; fotos migradas de antes de qualquer um dos dois apps
// seguem soltas em outras pastas (ex: "Setor/Cargo/nome.webp"), sem esse
// prefixo, mas continuam servindo pois a normalização abaixo é condicional.
const PREFIXO_PROXY_FOTOS = '/api/fotos/';

// Bucket é privado — armazenamos o caminho do proxy (ou, para fotos antigas,
// a key crua), e toda exibição passa por uma URL assinada gerada na hora,
// com validade curta.
export async function uploadFoto(bucket: S3Bucket, buffer: Buffer, mimeType: string): Promise<string> {
  const extensao = EXTENSAO_POR_MIME[mimeType] ?? 'jpg';
  const key = `uploads/${randomUUID()}.${extensao}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: getBucketName(bucket),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return `${PREFIXO_PROXY_FOTOS}${key}`;
}

function normalizarKey(key: string): string {
  if (!key.startsWith(PREFIXO_PROXY_FOTOS)) return key;
  return decodeURIComponent(key.slice(PREFIXO_PROXY_FOTOS.length));
}

export async function assinarUrlFoto(bucket: S3Bucket, key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucketName(bucket), Key: normalizarKey(key) });
  return getSignedUrl(s3Client, command, { expiresIn: URL_ASSINADA_TTL_SEGUNDOS });
}

export async function deletarFoto(bucket: S3Bucket, key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: getBucketName(bucket), Key: normalizarKey(key) }));
}
