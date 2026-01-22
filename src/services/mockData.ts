export interface Morador {
  id: number;
  nome: string;
  cpf: string;
  unidade: string;
  telefone: string;
  email: string;
  foto: string | null;
  status: 'ativo' | 'inativo';
}

export interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  moradorId: number;
  moradorNome?: string;
  ano?: string;
}

// Dados iniciais de Moradores
export const initialMoradores: Morador[] = [
  {
    id: 1,
    nome: 'João Silva',
    cpf: '123.456.789-00',
    unidade: 'Bloco A - 101',
    telefone: '(11) 99999-9999',
    email: 'joao.silva@email.com',
    foto: null,
    status: 'ativo'
  },
  {
    id: 2,
    nome: 'Maria Oliveira',
    cpf: '987.654.321-00',
    unidade: 'Bloco B - 204',
    telefone: '(11) 98888-8888',
    email: 'maria.oliveira@email.com',
    foto: null,
    status: 'ativo'
  },
  {
    id: 3,
    nome: 'Carlos Santos',
    cpf: '456.789.123-00',
    unidade: 'Bloco A - 302',
    telefone: '(11) 97777-7777',
    email: 'carlos.santos@email.com',
    foto: null,
    status: 'inativo'
  }
];

// Dados iniciais de Veículos
export const initialVeiculos: Veiculo[] = [
  {
    id: 1,
    placa: 'ABC-1234',
    modelo: 'Civic',
    marca: 'Honda',
    cor: 'Prata',
    moradorId: 1,
    moradorNome: 'João Silva',
    ano: '2020'
  },
  {
    id: 2,
    placa: 'XYZ-9876',
    modelo: 'Corolla',
    marca: 'Toyota',
    cor: 'Preto',
    moradorId: 2,
    moradorNome: 'Maria Oliveira',
    ano: '2021'
  }
];
