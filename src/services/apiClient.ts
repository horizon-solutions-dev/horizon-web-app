import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import type { LoginResponse } from '../models/api.model';

const API_BASE_URL = 'https://horizonauthapi-dfbah3fghze8f9gb.australiaeast-01.azurewebsites.net';
type ProcessingListener = (isProcessing: boolean) => void;
const AUTH_EXPIRED_MESSAGE_KEY = 'authExpiredMessage';

export class ApiClient {
  private client: AxiosInstance;
  private static isRefreshing = false;
  private static isSessionEnding = false;
  private static failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void }> = [];
  private static processingCount = 0;
  private static processingListeners = new Set<ProcessingListener>();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleUnauthorized(error)
    );
  }

  public static subscribeProcessing(listener: ProcessingListener) {
    ApiClient.processingListeners.add(listener);
    listener(ApiClient.processingCount > 0);
    return () => {
      ApiClient.processingListeners.delete(listener);
    };
  }

  private static notifyProcessingListeners() {
    const isProcessing = ApiClient.processingCount > 0;
    ApiClient.processingListeners.forEach((listener) => listener(isProcessing));
  }

  private static startProcessing() {
    ApiClient.processingCount += 1;
    ApiClient.notifyProcessingListeners();
  }

  private static stopProcessing() {
    ApiClient.processingCount = Math.max(0, ApiClient.processingCount - 1);
    ApiClient.notifyProcessingListeners();
  }

  private async runWithProcessing<T>(request: () => Promise<T>): Promise<T> {
    ApiClient.startProcessing();
    try {
      return await request();
    } finally {
      ApiClient.stopProcessing();
    }
  }

  public async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown): Promise<T> {
    return this.runWithProcessing(async () => {
      const response = await this.client.post<T>(url, data);
      return response.data;
    });
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    return this.runWithProcessing(async () => {
      const response = await this.client.put<T>(url, data);
      return response.data;
    });
  }

  public async delete<T>(url: string): Promise<T> {
    return this.runWithProcessing(async () => {
      const response = await this.client.delete<T>(url);
      return response.data;
    });
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
    window.location.replace('/login');
  }

  private async handleUnauthorized(error: AxiosError) {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
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

