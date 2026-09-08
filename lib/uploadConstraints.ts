// Regras de validação de upload de foto (formatos aceitos + tamanho máximo)
// — módulo neutro, sem nenhum import server-only (crypto/aws-sdk), pra poder
// ser importado tanto por app/api/uploads/route.ts (server) quanto por
// components/Ui/PhotoUpload/PhotoUpload.tsx (client component). Antes esses
// valores viviam em lib/s3/fotos.ts (que arrasta @aws-sdk/client-s3) e o
// componente cliente reimplicava os mesmos literais localmente.
export const MIME_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
