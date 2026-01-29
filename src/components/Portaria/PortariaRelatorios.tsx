import PagePlaceholder from '../../shared/components/PagePlaceholder';

export default function PortariaRelatorios() {
  return (
    <PagePlaceholder
      title="Portaria - Relatorios"
      subtitle="Relatorios e auditoria."
      actions={[
        { label: 'Gerar relatorio', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Relatorio', 'Periodo', 'Status'],
        rows: [
          ['Acessos', '01/2026', 'Gerado'],
          ['Visitantes', '12/2025', 'Gerado'],
        ],
      }}
    />
  );
}
