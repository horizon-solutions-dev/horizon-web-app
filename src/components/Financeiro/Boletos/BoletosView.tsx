import PagePlaceholder from '../../../shared/components/PagePlaceholder';

export default function BoletosView() {
  return (
    <PagePlaceholder
      title="Boletos"
      subtitle="Controle de boletos do condominio."
      actions={[
        { label: 'Novo boleto', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Competencia', 'Valor', 'Status'],
        rows: [
          ['01/2026', 'R$ 420,00', 'Pendente'],
          ['12/2025', 'R$ 410,00', 'Pago'],
        ],
      }}
    />
  );
}
