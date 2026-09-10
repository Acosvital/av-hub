# Pendência — coluna `foto_url` em `core.unidades`

**Contexto:** adicionamos upload de foto para Funcionários e Unidades, com crop no
navegador (`react-filerobot-image-editor`) e armazenamento no SeaweedFS interno via
`@aws-sdk/client-s3` (bucket privado, URLs assinadas geradas sob demanda pelo Next.js —
ver `lib/s3/fotos.ts` e `app/api/uploads/route.ts`).

- **Funcionários** — reaproveita a coluna `photo_url` que já existia em
  `core.funcionarios`. Nada muda no schema. **Atenção**: o significado do valor muda —
  antes era uma URL externa digitada livremente, agora é a **key do objeto no bucket**
  (ex: `a1b2c3d4-....jpg`), sem domínio. O Next.js resolve isso para uma URL assinada só
  na leitura (`GET /api/funcionarios`), então o backend só precisa armazenar/retornar o
  valor como texto opaco, sem validar formato de URL.

- **Unidades** — precisa de uma coluna nova:

```sql
ALTER TABLE core.unidades ADD COLUMN foto_url varchar(255);
```

Mesma semântica do funcionário: guarda a key do objeto no bucket `organograma-prd-empresa`,
não uma URL. Nula/vazia = sem foto.

**Nenhuma mudança de contrato de API é necessária** além da coluna acima — o campo
`foto_url` já é enviado no corpo de `POST/PUT /unidades` como texto, igual aos demais
campos.
