import PagePlaceholder from '../../shared/components/PagePlaceholder';

export default function ReservasListagem() {
  return (
    <PagePlaceholder
      title="Reservas - Listagem"
      subtitle="Listagem completa das reservas."
      actions={[
        { label: 'Nova reserva', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Morador', 'Espaco', 'Status'],
        rows: [
          ['Ana Costa', 'Salao de festas', 'Confirmada'],
          ['Bruno Alves', 'Piscina', 'Pendente'],
        ],
      }}
    />
  );
}
