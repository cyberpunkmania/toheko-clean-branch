
import apiClient from './api';
import { Saving, SavingRequest, AcknowledgementResponse } from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const savingService = {
  getAllSavings: async (): Promise<Saving[]> => {
    const response = await apiClient.get(`${ENDPOINTS.SAVINGS.BASE}/findAll`);
    return response.data.content;
  },

  getSavingById: async (id: number): Promise<Saving> => {
    const response = await apiClient.get(`${ENDPOINTS.SAVINGS.BASE}/findBySavingId/${id}`);
    return response.data;
  },

  createSaving: async (saving: SavingRequest): Promise<AcknowledgementResponse> => {
    const response = await apiClient.post(`${ENDPOINTS.SAVINGS.BASE}/create`, saving);
    return response.data;
  },

  updateSaving: async (saving: SavingRequest): Promise<AcknowledgementResponse> => {
    const response = await apiClient.put(`${ENDPOINTS.SAVINGS.BASE}/update`, saving);
    return response.data;
  },

  deleteSaving: async (id: number): Promise<AcknowledgementResponse> => {
    const response = await apiClient.delete(`${ENDPOINTS.SAVINGS.BASE}/deleteBySavingId/${id}`);
    return response.data;
  }
};
