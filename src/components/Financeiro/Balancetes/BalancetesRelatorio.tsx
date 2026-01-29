import PagePlaceholder from '../../../shared/components/PagePlaceholder';

export default function BalancetesRelatorio() {
  return (
    <PagePlaceholder
      title="Balancetes - Relatorio"
      subtitle="Relatorios consolidados."
      actions={[
        { label: 'Gerar relatorio', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Tipo', 'Periodo', 'Status'],
        rows: [
          ['Consolidado', '01/2026', 'Gerado'],
          ['Analitico', '12/2025', 'Gerado'],
        ],
      }}
    />
  );
}
