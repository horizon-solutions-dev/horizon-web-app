import PagePlaceholder from '../../../shared/components/PagePlaceholder';

export default function BalancetesView() {
  return (
    <PagePlaceholder
      title="Balancetes"
      subtitle="Visao geral de balancetes."
      actions={[
        { label: 'Novo balancete', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Periodo', 'Receitas', 'Despesas'],
        rows: [
          ['01/2026', 'R$ 120.000', 'R$ 98.000'],
          ['12/2025', 'R$ 118.000', 'R$ 101.000'],
        ],
      }}
    />
  );
}
