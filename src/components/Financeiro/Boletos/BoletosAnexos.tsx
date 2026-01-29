import PagePlaceholder from '../../../shared/components/PagePlaceholder';

export default function BoletosAnexos() {
  return (
    <PagePlaceholder
      title="Boletos - Anexos"
      subtitle="Gestao de anexos de boletos."
      actions={[
        { label: 'Enviar anexo', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Documento', 'Boleto', 'Status'],
        rows: [
          ['Comprovante.pdf', '01/2026', 'Validado'],
          ['Recibo.jpg', '12/2025', 'Pendente'],
        ],
      }}
    />
  );
}
