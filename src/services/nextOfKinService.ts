import apiClient from './api';
import { NextOfKin, NextOfKinRequestDTO, AcknowledgementResponse } from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const nextOfKinService = {
  getAllNextOfKins: async (): Promise<NextOfKin[]> => {
    const response = await apiClient.get(`${ENDPOINTS.NEXT_OF_KIN.BASE}/getsAll`);
    return response.data.content || [];
  },

  getNextOfKinById: async (nextOfKinId: number): Promise<NextOfKin> => {
    const response = await apiClient.get(`${ENDPOINTS.NEXT_OF_KIN.BASE}/${nextOfKinId}`);
    return response.data;
  },

  createNextOfKin: async (nextOfKin: NextOfKinRequestDTO): Promise<AcknowledgementResponse> => {
    const response = await apiClient.post(ENDPOINTS.NEXT_OF_KIN.BASE, nextOfKin);
    return response.data;
  },

  updateNextOfKin: async (nextOfKinId: number, nextOfKin: NextOfKinRequestDTO): Promise<AcknowledgementResponse> => {
    const response = await apiClient.put(`${ENDPOINTS.NEXT_OF_KIN.BASE}/${nextOfKinId}`, nextOfKin);
    return response.data;
  },

  deleteNextOfKin: async (nextOfKinId: number): Promise<AcknowledgementResponse> => {
    const response = await apiClient.delete(`${ENDPOINTS.NEXT_OF_KIN.BASE}/${nextOfKinId}`);
    return response.data;
  },

  getNextOfKinsByMember: async (memberId: number): Promise<any[]> => {
    const response = await apiClient.get(`${ENDPOINTS.NEXT_OF_KIN.BASE}/member/${memberId}`);
    return response.data;
  }
};
