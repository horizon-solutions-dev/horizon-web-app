import PagePlaceholder from '../../shared/components/PagePlaceholder';

export default function PortariaUsuarios() {
  return (
    <PagePlaceholder
      title="Portaria - Usuarios"
      subtitle="Controle de usuarios e acessos."
      actions={[
        { label: 'Novo usuario', variant: 'contained' },
        { label: 'Filtrar' },
      ]}
      table={{
        columns: ['Nome', 'Perfil', 'Status'],
        rows: [
          ['Joao Silva', 'Porteiro', 'Ativo'],
          ['Maria Lima', 'Supervisor', 'Ativo'],
        ],
      }}
    />
  );
}
