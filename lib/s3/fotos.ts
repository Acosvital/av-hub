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

// Bucket é privado — armazenamos só a key do objeto (não uma URL), e toda
// exibição passa por uma URL assinada gerada na hora, com validade curta.
export async function uploadFoto(bucket: S3Bucket, buffer: Buffer, mimeType: string): Promise<string> {
  const extensao = EXTENSAO_POR_MIME[mimeType] ?? 'jpg';
  const key = `${randomUUID()}.${extensao}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: getBucketName(bucket),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return key;
}

// Funcionários migrados do sistema antigo guardam photo_url no formato
// "/api/fotos/Setor/Cargo/nome.webp" (endpoint do sistema legado), mas a key
// real do objeto no bucket é o path sem esse prefixo, ex: "Setor/Cargo/nome.webp".
const PREFIXO_FOTO_LEGADO = '/api/fotos/';

function normalizarKey(key: string): string {
  if (!key.startsWith(PREFIXO_FOTO_LEGADO)) return key;
  return decodeURIComponent(key.slice(PREFIXO_FOTO_LEGADO.length));
}

export async function assinarUrlFoto(bucket: S3Bucket, key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucketName(bucket), Key: normalizarKey(key) });
  return getSignedUrl(s3Client, command, { expiresIn: URL_ASSINADA_TTL_SEGUNDOS });
}

export async function deletarFoto(bucket: S3Bucket, key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: getBucketName(bucket), Key: key }));
}
