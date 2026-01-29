import PagePlaceholder from '../../shared/components/PagePlaceholder';

export default function ReservasTipo() {
  return (
    <PagePlaceholder
      title="Reservas - Tipo"
      subtitle="Tipos de reservas cadastrados."
      actions={[
        { label: 'Novo tipo', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Tipo', 'Limite', 'Status'],
        rows: [
          ['Salao de festas', '1 por dia', 'Ativo'],
          ['Churrasqueira', '2 por dia', 'Ativo'],
        ],
      }}
    />
  );
}
