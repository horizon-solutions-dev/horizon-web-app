import PagePlaceholder from '../../shared/components/PagePlaceholder';

export default function EncomendasRecebimento() {
  return (
    <PagePlaceholder
      title="Recebimento de Encomendas"
      subtitle="Registro e controle de encomendas recebidas."
      actions={[
        { label: 'Registrar', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Morador', 'Volume', 'Status'],
        rows: [
          ['Apto 301', 'Caixa', 'Recebida'],
          ['Apto 205', 'Envelope', 'Aguardando'],
        ],
      }}
    />
  );
}
