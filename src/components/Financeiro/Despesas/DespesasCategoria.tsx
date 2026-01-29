import PagePlaceholder from '../../../shared/components/PagePlaceholder';

export default function DespesasCategoria() {
  return (
    <PagePlaceholder
      title="Despesas - Categorias"
      subtitle="Categorias de despesas cadastradas."
      actions={[
        { label: 'Nova categoria', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Categoria', 'Status', 'Atualizado'],
        rows: [
          ['Manutencao', 'Ativa', 'Hoje'],
          ['Limpeza', 'Ativa', 'Ontem'],
        ],
      }}
    />
  );
}
