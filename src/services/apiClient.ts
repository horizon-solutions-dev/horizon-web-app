import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import type { LoginResponse } from '../models/api.model';

// Usar URL fixa por enquanto
const API_BASE_URL = 'https://horizonauthapi-dfbah3fghze8f9gb.australiaeast-01.azurewebsites.net';

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
   //   baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token aos headers
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para tratar erros de resposta
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleUnauthorized(error, (config) => this.client(config))
    );

    // Interceptor global para chamadas diretas via axios
    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleUnauthorized(error, (config) => axios(config))
    );
  }

  public async get<T>(url: string): Promise<T> {
    try {
      const response = await this.client.get<T>(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async post<T>(url: string, data?: unknown): Promise<T> {
    try {
      if (data instanceof FormData) {
        const response = await this.client.post<T>(url, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      }
      const response = await this.client.post<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/refresh-token`,
      {
        token: localStorage.getItem('token'),
        refreshToken,
      }
    );
    return response.data;
  }

  private async handleUnauthorized(
    error: AxiosError,
    retryRequest: (config: AxiosRequestConfig) => Promise<unknown>
  ) {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isUnauthorized = error.response?.status === 401;
    const requestUrl = String(originalRequest?.url || '').toLowerCase();
    const isRefreshRequest = requestUrl.includes('/refresh-token');

    if (!isUnauthorized || !originalRequest || originalRequest._retry || isRefreshRequest) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await this.refreshAccessToken(refreshToken);
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${response.token}`;
      }

      return retryRequest(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | { message?: string; validations?: Array<{ field: string; message: string }> }
        | string
        | undefined;

      if (typeof data === 'string') {
        throw new Error(data);
      }

      if (data?.validations?.length) {
        const validationMessage = data.validations.map((item) => item.message).join('\n');
        throw new Error(validationMessage);
      }

      const message = data?.message || error.message;
      throw new Error(message);
    }
    throw error;
  }
}

export const apiClient = new ApiClient();
