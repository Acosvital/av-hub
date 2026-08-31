import { S3Client } from '@aws-sdk/client-s3';

export type S3Bucket = 'pessoas' | 'empresa';

// forcePathStyle é necessário para storages S3-compatíveis (SeaweedFS) —
// sem isso o SDK monta a URL no formato <bucket>.<endpoint>, que o SeaweedFS não resolve.
export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export function getBucketName(bucket: S3Bucket): string {
  return bucket === 'pessoas' ? process.env.S3_BUCKET_PESSOAS! : process.env.S3_BUCKET_EMPRESA!;
}
