
import apiClient from './api';
import { AuthenticationRequest, RegisterRequest, AuthenticationResponse } from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const authService = {
  login: async (request: AuthenticationRequest): Promise<AuthenticationResponse> => {
    const response = await apiClient.post(ENDPOINTS.AUTH.AUTHENTICATE, request);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  register: async (request: RegisterRequest): Promise<AuthenticationResponse> => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, request);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  refreshToken: async (): Promise<void> => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN);
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
  },

  logout: (): void => {
    localStorage.removeItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};
