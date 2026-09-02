import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const bucket = process.env.S3_BUCKET_PESSOAS;
let continuationToken;
let total = 0;

do {
  const result = await s3Client.send(
    new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken, MaxKeys: 50 })
  );
  for (const obj of result.Contents ?? []) {
    console.log(obj.Key);
    total++;
  }
  continuationToken = result.NextContinuationToken;
} while (continuationToken && total < 200);

console.error(`\n(${total} objetos listados)`);
