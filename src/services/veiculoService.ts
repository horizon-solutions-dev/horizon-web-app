import { apiClient } from './apiClient';

export interface Veiculo {
  id?: string;
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  moradorId: string;
  moradorNome?: string;
  ano?: string;
}

class VeiculoService {
  private baseUrl = '/api/v1/veiculos';

  async getVeiculos(condominiumId: string, pageNumber?: number, pageSize?: number) {
    try {
      const params = new URLSearchParams({
        condominiumId,
        ...(pageNumber !== undefined && { pageNumber: pageNumber.toString() }),
        ...(pageSize !== undefined && { pageSize: pageSize.toString() }),
      });
      
      return await apiClient.get<Veiculo[]>(`${this.baseUrl}?${params}`);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      throw error;
    }
  }

  async getVeiculoById(id: string) {
    try {
      return await apiClient.get<Veiculo>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar veículo:', error);
      throw error;
    }
  }

  async getVeiculosByMorador(moradorId: string) {
    try {
      return await apiClient.get<Veiculo[]>(`${this.baseUrl}/morador/${moradorId}`);
    } catch (error) {
      console.error('Erro ao buscar veículos do morador:', error);
      throw error;
    }
  }

  async createVeiculo(veiculo: Omit<Veiculo, 'id'>) {
    try {
      return await apiClient.post<Veiculo>(this.baseUrl, veiculo);
    } catch (error) {
      console.error('Erro ao criar veículo:', error);
      throw error;
    }
  }

  async updateVeiculo(id: string, veiculo: Omit<Veiculo, 'id'>) {
    try {
      return await apiClient.put<Veiculo>(`${this.baseUrl}/${id}`, veiculo);
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error);
      throw error;
    }
  }

  async deleteVeiculo(id: string) {
    try {
      return await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
      throw error;
    }
  }
}

export const veiculoService = new VeiculoService();
