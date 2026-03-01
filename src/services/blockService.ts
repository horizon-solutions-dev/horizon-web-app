import axios from 'axios';
import { apiClient } from './apiClient';
import type { PagedResponse } from '../models/pagination.model';
import { normalizePagedResponse } from '../shared/utils/pagination';

export interface CondominiumBlockRequest {
  condominiumId: string;
  code: string;
  name: string;
  commit?: boolean;
}

export interface CondominiumBlock extends CondominiumBlockRequest {
  condominiumBlockId: string;
}

export type CondominiumBlockPagedResponse = PagedResponse<CondominiumBlock>;

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

  async validateBlock(block: CondominiumBlockRequest) {
    try {
      await apiClient.post<{ condominiumBlockId?: string }>(this.baseUrl, block);
      return { valid: true, validations: [] as Array<{ field: string; message: string }> };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const data = error.response?.data as
          | { validations?: Array<{ field: string; message: string }> }
          | undefined;
        return { valid: false, validations: data?.validations ?? [] };
      }
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
      const response = await apiClient.get<CondominiumBlock[] | CondominiumBlockPagedResponse>(
        `${this.baseUrl}?${params}`
      );
      
      return normalizePagedResponse(response, pageNumber, pageSize);
    } catch (error) {
      console.error('Erro ao buscar blocos:', error);
      throw error;
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

  async deleteBlock(id: string) {
    try {
      return await apiClient.delete<void>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao excluir bloco:', error);
      throw error;
    }
  }
}

export const blockService = new BlockService();
