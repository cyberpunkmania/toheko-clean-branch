/* eslint-disable @typescript-eslint/no-explicit-any */

import apiClient from './api';
import { 
  Repayment, 
  RepaymentRequest,
  RecordPaymentRequest,
  WaiveRequest,
  CancelRequest,
  AcknowledgementResponse,
  AcknowledgementResponseObject
} from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const repaymentService = {
  // Get all repayments with pagination
  getAllRepayments: async (page = 0, size = 20, sort = 'id,desc'): Promise<Repayment[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPAYMENTS.BASE}?page=${page}&size=${size}&sort=${sort}`);
      
      // Handle different response structures
      if (response.data && response.data.data && response.data.data.content) {
        return response.data.data.content;
      } else if (response.data && response.data.content) {
        return response.data.content;
      } else {
        console.error('Unexpected response structure:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching repayments:', error);
      return [];
    }
  },

  // Get repayment by ID
  getRepaymentById: async (id: number): Promise<Repayment | null> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPAYMENTS.BASE}/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching repayment with ID ${id}:`, error);
      return null;
    }
  },

  // Get repayments by loan ID
  getRepaymentsByLoanId: async (loanId: number): Promise<Repayment[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPAYMENTS.BASE}/by-loan/${loanId}`);
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching repayments for loan ${loanId}:`, error);
      return [];
    }
  },

  // Get repayments by status
  getRepaymentsByStatus: async (status: string): Promise<Repayment[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPAYMENTS.BASE}/by-status/${status}`);
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching repayments with status ${status}:`, error);
      return [];
    }
  },

  // Get overdue repayments
  getOverdueRepayments: async (): Promise<Repayment[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPAYMENTS.BASE}/overdue`);
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching overdue repayments:', error);
      return [];
    }
  },

  // Get repayments by due date
  getRepaymentsByDueDate: async (dueDate: string): Promise<Repayment[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPAYMENTS.BASE}/by-due-date?dueDate=${dueDate}`);
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching repayments with due date ${dueDate}:`, error);
      return [];
    }
  },

  // Get repayments by due date range
  getRepaymentsByDueDateRange: async (startDate: string, endDate: string): Promise<Repayment[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPAYMENTS.BASE}/by-due-date-range?startDate=${startDate}&endDate=${endDate}`);
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching repayments with due date range ${startDate} - ${endDate}:`, error);
      return [];
    }
  },

  // Get repayments by code
  getRepaymentsByCode: async (code: string): Promise<Repayment[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPAYMENTS.BASE}/by-code/${code}`);
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching repayments with code ${code}:`, error);
      return [];
    }
  },

  // Create a new repayment
  createRepayment: async (repayment: RepaymentRequest): Promise<Repayment | null> => {
    try {
      const response = await apiClient.post(ENDPOINTS.REPAYMENTS.BASE, repayment);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating repayment:', error);
      return null;
    }
  },

  // Update a repayment
  updateRepayment: async (id: number, repayment: RepaymentRequest): Promise<Repayment | null> => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.REPAYMENTS.BASE}/${id}`, repayment);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error updating repayment with ID ${id}:`, error);
      return null;
    }
  },

  // Delete a repayment
  deleteRepayment: async (id: number): Promise<AcknowledgementResponseObject> => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.REPAYMENTS.BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting repayment with ID ${id}:`, error);
      return { success: false, message: 'Failed to delete repayment' };
    }
  },

  // Record a payment for a repayment
  recordPayment: async (id: number, paymentData: RecordPaymentRequest): Promise<Repayment | null> => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.REPAYMENTS.BASE}/${id}/record-payment`, paymentData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error recording payment for repayment with ID ${id}:`, error);
      return null;
    }
  },

  // Waive a repayment
  waiveRepayment: async (id: number, waiveData: WaiveRequest): Promise<Repayment | null> => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.REPAYMENTS.BASE}/${id}/waive`, waiveData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error waiving repayment with ID ${id}:`, error);
      return null;
    }
  },

  // Cancel a repayment
  cancelRepayment: async (id: number, cancelData: CancelRequest): Promise<Repayment | null> => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.REPAYMENTS.BASE}/${id}/cancel`, cancelData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error cancelling repayment with ID ${id}:`, error);
      return null;
    }
  }
};
