import PagePlaceholder from '../../../shared/components/PagePlaceholder';

export default function BoletosDownload() {
  return (
    <PagePlaceholder
      title="Boletos - Download"
      subtitle="Central de downloads de boletos."
      actions={[
        { label: 'Gerar lote', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Arquivo', 'Periodo', 'Status'],
        rows: [
          ['Boletos_01_2026.pdf', '01/2026', 'Disponivel'],
          ['Boletos_12_2025.pdf', '12/2025', 'Disponivel'],
        ],
      }}
    />
  );
}
