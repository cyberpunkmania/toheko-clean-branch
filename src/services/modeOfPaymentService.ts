import apiClient from './api';
import { 
  ModeOfPayment,
  ModeOfPaymentDto,
  AcknowledgementResponse 
} from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export interface ModeOfPaymentFormValues {
  name: string;
  description: string;
  shortDescription?: string;
}

export const modeOfPaymentService = {
  getAllModesOfPayment: async (): Promise<ModeOfPayment[]> => {
    const response = await apiClient.get(`${ENDPOINTS.MODE_OF_PAYMENTS.BASE}/all`);
    return response.data;
  },

  getModeOfPaymentById: async (id: number): Promise<ModeOfPayment> => {
    const response = await apiClient.get(`${ENDPOINTS.MODE_OF_PAYMENTS.BASE}/get/${id}`);
    return response.data;
  },

  createModeOfPayment: async (modeOfPayment: ModeOfPaymentFormValues): Promise<AcknowledgementResponse> => {
    const response = await apiClient.post(`${ENDPOINTS.MODE_OF_PAYMENTS.BASE}/create`, modeOfPayment);
    return response.data;
  },

  updateModeOfPayment: async (id: number, modeOfPayment: ModeOfPaymentFormValues): Promise<AcknowledgementResponse> => {
    // Using the correct endpoint format as shown in the API documentation
    const response = await apiClient.put(`${ENDPOINTS.MODE_OF_PAYMENTS.BASE}/update/${id}`, modeOfPayment);
    return response.data;
  },

  deleteModeOfPayment: async (id: number): Promise<AcknowledgementResponse> => {
    // Using the correct endpoint format as shown in the API documentation
    const response = await apiClient.delete(`${ENDPOINTS.MODE_OF_PAYMENTS.BASE}/delete/${id}`);
    return response.data;
  }
};
