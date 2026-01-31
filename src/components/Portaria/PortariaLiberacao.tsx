import PagePlaceholder from '../../shared/components/PagePlaceholder';

export default function PortariaLiberacao() {
  return (
    <PagePlaceholder
      title="Portaria - Liberacao"
      subtitle="Liberacoes e autorizacoes."
      actions={[
        { label: 'Nova liberacao', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Visitante', 'Unidade', 'Status'],
        rows: [
          ['Carlos P.', 'Apto 302', 'Aguardando'],
          ['Fernanda R.', 'Apto 105', 'Liberado'],
        ],
      }}
    />
  );
}
