'use client';

import type { ComponentProps } from 'react';
import { Acao, usePermission } from '@/hooks/usePermission';
import Button from '@/components/Ui/Button/Button';

// extende as props do componente Button, adicionando acao e telaId:
interface Props extends ComponentProps<typeof Button> {
  acao: Acao;
  telaId?: string;
}

//Se o usuario não tiver determinada permissão para a tela, retorna null:
export default function PermissionButton({ acao, telaId, ...props }: Props) {
  const { can } = usePermission();
  if (!can(acao, telaId)) return null;
  return <Button {...props} />;
}
