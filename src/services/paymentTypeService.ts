import apiClient from './api';
import { 
  PaymentType,
  PaymentTypeRequest,
  AcknowledgementResponse 
} from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export type PaymentTypeFormValues = {
  name: string;
  paymentDescription: string;
  paymentShortDesc: string;
};

export const paymentTypeService = {
  getAllPaymentTypes: async (): Promise<PaymentType[]> => {
    const response = await apiClient.get(`${ENDPOINTS.PAYMENT_TYPES.BASE}/findAll`);
    return response.data;
  },

  getPaymentTypeById: async (id: number): Promise<PaymentType> => {
    const response = await apiClient.get(`${ENDPOINTS.PAYMENT_TYPES.BASE}/${id}`);
    return response.data;
  },

  updatePaymentType: async (paymentType: PaymentTypeRequest): Promise<AcknowledgementResponse> => {
    
    //console.log("Updating payment type with data:", paymentType);
    
    
    const payload = {
      ...paymentType,
      paymentTypeId: Number(paymentType.paymentTypeId)
    };
    
    
    const response = await apiClient.put(`${ENDPOINTS.PAYMENT_TYPES.BASE}/update`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  createPaymentType: async (paymentType: PaymentTypeFormValues): Promise<AcknowledgementResponse> => {
    const response = await apiClient.post(`${ENDPOINTS.PAYMENT_TYPES.BASE}/create`, paymentType);
    return response.data;
  },
  
  deletePaymentType: async (id: number): Promise<AcknowledgementResponse> => {
    const response = await apiClient.delete(`${ENDPOINTS.PAYMENT_TYPES.BASE}/delete?paymentTypeId=${id}`);
    return response.data;
  }
};
