import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import type { LoginResponse } from '../models/api.model';

const API_BASE_URL = 'https://horizonauthapi-dfbah3fghze8f9gb.australiaeast-01.azurewebsites.net';
const AUTH_EXPIRED_MESSAGE_KEY = 'authExpiredMessage';

export class ApiClient {
  private client: AxiosInstance;
  private static isRefreshing = false;
  private static isSessionEnding = false;
  private static failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Adiciona o header 'Content-Type' para requisições que não são FormData,
      // permitindo que o navegador defina o 'Content-Type' correto para uploads.
      if (config.headers && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleUnauthorized(error)
    );
  }

  public async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  private processQueue(error: any, token: string | null = null) {
    ApiClient.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    ApiClient.failedQueue = [];
  }

  private clearSessionStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('condominiumId');
    localStorage.removeItem('condominium');
    localStorage.removeItem('dataCondominium');
    localStorage.removeItem('organizationId');
    localStorage.removeItem('isAuthenticated');
  }

  private endSessionAndRedirect(message: string) {
    if (ApiClient.isSessionEnding) {
      return;
    }
    ApiClient.isSessionEnding = true;
    this.clearSessionStorage();
    sessionStorage.setItem(AUTH_EXPIRED_MESSAGE_KEY, message);
    window.location.replace('/');
  }

  private async handleUnauthorized(error: AxiosError) {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest?._retry) {
      this.endSessionAndRedirect('Sua sessão expirou. Faça login novamente.');
      return Promise.reject(error);
    }

    if (ApiClient.isRefreshing) {
      return new Promise((resolve, reject) => {
        ApiClient.failedQueue.push({ resolve, reject });
      }).then(token => {
        if(originalRequest.headers)
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return this.client(originalRequest);
      });
    }

    originalRequest._retry = true;
    ApiClient.isRefreshing = true;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      ApiClient.isRefreshing = false;
      this.endSessionAndRedirect('Sua sessão expirou. Faça login novamente.');
      return Promise.reject(error);
    }

    try {
      const response = await this.refreshAccessToken(refreshToken);
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${response.token}`;
      }
      
      this.processQueue(null, response.token);
      return this.client(originalRequest);
    } catch (refreshError) {
      this.processQueue(refreshError, null);
      this.endSessionAndRedirect('Sua sessão expirou. Faça login novamente.');
      return Promise.reject(refreshError);
    } finally {
      ApiClient.isRefreshing = false;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
    const refreshClient = axios.create();
    const response = await refreshClient.post(
      `${API_BASE_URL}/api/v1/auth/refresh-token`,
      {
        token: localStorage.getItem('token'),
        refreshToken,
      }
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();

