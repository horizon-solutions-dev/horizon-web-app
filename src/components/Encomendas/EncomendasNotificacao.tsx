import PagePlaceholder from '../../shared/components/PagePlaceholder';

export default function EncomendasNotificacao() {
  return (
    <PagePlaceholder
      title="Notificacoes de Encomendas"
      subtitle="Envio e acompanhamento de notificacoes."
      actions={[
        { label: 'Nova notificacao', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Morador', 'Canal', 'Status'],
        rows: [
          ['Apto 301', 'App', 'Enviado'],
          ['Apto 205', 'Email', 'Pendente'],
        ],
      }}
    />
  );
}
