import PagePlaceholder from '../../../shared/components/PagePlaceholder';

export default function BalancetesDownload() {
  return (
    <PagePlaceholder
      title="Balancetes - Download"
      subtitle="Download de balancetes."
      actions={[
        { label: 'Gerar relatorio', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Arquivo', 'Periodo', 'Status'],
        rows: [
          ['Balancete_01_2026.pdf', '01/2026', 'Disponivel'],
          ['Balancete_12_2025.pdf', '12/2025', 'Disponivel'],
        ],
      }}
    />
  );
}
