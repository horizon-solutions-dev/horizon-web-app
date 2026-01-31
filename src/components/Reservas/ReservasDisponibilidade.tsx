import PagePlaceholder from '../../shared/components/PagePlaceholder';

export default function ReservasDisponibilidade() {
  return (
    <PagePlaceholder
      title="Reservas - Disponibilidade"
      subtitle="Disponibilidade de espacos."
      actions={[
        { label: 'Consultar', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Espaco', 'Data', 'Disponivel'],
        rows: [
          ['Salao de festas', '20/01/2026', 'Nao'],
          ['Piscina', '20/01/2026', 'Sim'],
        ],
      }}
    />
  );
}
