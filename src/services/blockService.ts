import { apiClient } from './apiClient';

export interface CondominiumBlockRequest {
  condominiumId: string;
  code: string;
  name: string;
}

export interface CondominiumBlock extends CondominiumBlockRequest {
  condominiumBlockId: string;
}

class BlockService {
  private baseUrl =
    'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/blocks';

  async createBlock(block: CondominiumBlockRequest) {
    try {
      return await apiClient.post<{ condominiumBlockId: string }>(this.baseUrl, block);
    } catch (error) {
      console.error('Erro ao criar bloco:', error);
      throw error;
    }
  }

  async getBlocks(condominiumId: string, pageNumber?: number, pageSize?: number) {
    try {
      const params = new URLSearchParams({
        Id: condominiumId,
        ...(pageNumber !== undefined && { PageNumber: pageNumber.toString() }),
        ...(pageSize !== undefined && { PageSize: pageSize.toString() }),
      });
      const result = await apiClient.get<CondominiumBlock[]>(`${this.baseUrl}?${params}`);
      return {
        data: result,
        success: true,
      }
    } catch (error) {
      console.error('Erro ao buscar blocos:', error);
      return{
        data: [] as CondominiumBlock[],
        success: false,
      }
    }
  }

  async getBlockById(id: string) {
    try {
      return await apiClient.get<CondominiumBlock>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar bloco:', error);
      throw error;
    }
  }

  async updateBlock(id: string, block: CondominiumBlockRequest) {
    try {
      return await apiClient.put<{ condominiumBlockId: string }>(
        `${this.baseUrl}/${id}`,
        block
      );
    } catch (error) {
      console.error('Erro ao atualizar bloco:', error);
      throw error;
    }
  }
}

export const blockService = new BlockService();
