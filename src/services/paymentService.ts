
import apiClient from './api';
import { 
  Payment, 
  PaymentUpdateDTO,
  AcknowledgementResponse 
} from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export interface PaymentFormSchemaType {
  remarks?: string;
  phoneNumber: string;
  modeOfPaymentId: number;
  paymentTypeId: number;
  amount: number;
  accountId: number;  
  referenceNumber?: string;
}

export interface PaymentPromptSchemaType {
  accountId: number;
  amount: number;
  paymentTypeId: number;
  message?: string;
  dueDate?: string;
}

export const paymentService = {
  getAllPayments: async (page = 0, size = 10): Promise<any> => {
    try {
      //console.log('Fetching all payments');
      const response = await apiClient.get(`${ENDPOINTS.PAYMENTS.BASE}?page=${page}&size=${size}`);
      //console.log('Payments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching all payments:', error);
      throw error;
    }
  },

  getPaymentsByAccountId: async (accountId: number, page = 0, size = 10): Promise<any> => {
    try {
      //console.log(`Fetching payments for account ID: ${accountId}`);
      const response = await apiClient.get(`${ENDPOINTS.PAYMENTS.BASE}/account/${accountId}?page=${page}&size=${size}`);
      //console.log('Account payments response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payments for account ID ${accountId}:`, error);
      throw error;
    }
  },

  getPaymentKpis: async (): Promise<any> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.PAYMENTS.BASE}/kpis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment KPIs:', error);
      throw error;
    }
  },

  getPaymentById: async (paymentId: number): Promise<Payment> => {
    try {
      //console.log(`Fetching payment with ID: ${paymentId}`);
      const response = await apiClient.get(`${ENDPOINTS.PAYMENTS.BASE}/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment ${paymentId}:`, error);
      throw error;
    }
  },

  updatePayment: async (paymentId: number, payment: PaymentUpdateDTO): Promise<AcknowledgementResponse> => {
    try {
      //console.log(`Updating payment ${paymentId} with data:`, payment);
      const response = await apiClient.put(`${ENDPOINTS.PAYMENTS.BASE}/${paymentId}`, payment);
      return response.data;
    } catch (error) {
      console.error(`Error updating payment ${paymentId}:`, error);
      throw error;
    }
  },

  createPayment: async (payment: PaymentFormSchemaType): Promise<AcknowledgementResponse> => {
    try {
      //console.log('Creating new payment with data:', payment);
      const response = await apiClient.post(ENDPOINTS.PAYMENTS.BASE, payment);
      //console.log('Create payment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  promptPayment: async (promptData: PaymentPromptSchemaType): Promise<AcknowledgementResponse> => {
    try {
      //console.log('Sending payment prompt with data:', promptData);
      const response = await apiClient.post(`${ENDPOINTS.PAYMENTS.BASE}/prompt`, promptData);
      //console.log('Payment prompt response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending payment prompt:', error);
      throw error;
    }
  }
};
