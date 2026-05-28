import Card from '@/components/Ui/Card/Card';
import styles from './styles.module.css';
import PageHeader from "@/components/Layout/PageLayout/PageHeader/PageHeader";
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';

export default function Usuarios() {
  return (
    <>
      <PageHeader
        title='Usuários'
        subtitle='Gerencie os usuários do sistema'
      />
      <PageContent >
        <Card>
          <h2>Área de consulta e botões de ação</h2>
        </Card>
        <Card>
          <h2>Área do grid com resultados</h2>
        </Card>
      </PageContent>
    </>
  )
}