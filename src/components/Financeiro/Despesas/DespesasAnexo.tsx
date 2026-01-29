import PagePlaceholder from '../../../shared/components/PagePlaceholder';

export default function DespesasAnexo() {
  return (
    <PagePlaceholder
      title="Despesas - Anexos"
      subtitle="Anexos de despesas."
      actions={[
        { label: 'Enviar anexo', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Documento', 'Despesa', 'Status'],
        rows: [
          ['NotaFiscal.pdf', 'Manutencao', 'Validado'],
          ['Recibo.png', 'Limpeza', 'Pendente'],
        ],
      }}
    />
  );
}
