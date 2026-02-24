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
