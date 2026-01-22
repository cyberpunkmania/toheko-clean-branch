import apiClient from './api';
import { Disbursement, DisbursementRequest, DisbursementCompleteRequest, DisbursementFailCancelRequest } from "@/types/api";
import { ENDPOINTS } from '../config/endpoints';

// Disbursement KPI interfaces
export interface DisbursementKPI {
  totalCount: number;
  totalAmount: number;
  avgAmount: number;
  minAmount: number;
  maxAmount: number;
  uniqueMembers: number;
  byStatus: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
  byChannel: Array<{
    channel: string;
    count: number;
    amount: number;
  }>;
  executedCount: number;
  failedCount: number;
  successRate: number;
  approvalRate: number;
  daily: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
  topMembers: Array<{
    memberId: number;
    memberName: string;
    count: number;
    amount: number;
  }>;
}

export const disbursementService = {
  // Get all disbursements
  getAllDisbursements: async (): Promise<Disbursement[]> => {
    const response = await apiClient.get(`${ENDPOINTS.LOAN_DISBURSEMENTS.BASE}/search`);
    return response.data.data;
  },

  // Get disbursement by ID
  getDisbursementById: async (id: number): Promise<Disbursement> => {
    const response = await apiClient.get(`${ENDPOINTS.DISBURSEMENTS.BASE}/${id}`);
    return response.data;
  },

  // Get disbursements by status
  getDisbursementsByStatus: async (status: string): Promise<Disbursement[]> => {
    const response = await apiClient.get(`${ENDPOINTS.DISBURSEMENTS.BASE}/by-status/${status}`);
    return response.data.data;
  },

  // Get disbursements by loan application ID
  getDisbursementsByLoanApplication: async (loanApplicationId: number): Promise<Disbursement[]> => {
    const response = await apiClient.get(`${ENDPOINTS.DISBURSEMENTS.BASE}/by-loan-application/${loanApplicationId}`);
    return response.data.data;
  },

  // Get disbursements by disbursed by
  getDisbursementsByDisbursedBy: async (disbursedBy: number): Promise<Disbursement[]> => {
    const response = await apiClient.get(`${ENDPOINTS.DISBURSEMENTS.BASE}/by-disbursed-by/${disbursedBy}`);
    return response.data.data;
  },

  // Get disbursements by date range
  getDisbursementsByDateRange: async (startDate: string, endDate: string): Promise<Disbursement[]> => {
    const response = await apiClient.get(`${ENDPOINTS.DISBURSEMENTS.BASE}/by-date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data.data;
  },

  // Get disbursements by code
  getDisbursementsByCode: async (code: string): Promise<Disbursement[]> => {
    const response = await apiClient.get(`${ENDPOINTS.DISBURSEMENTS.BASE}/by-code/${code}`);
    return response.data.data;
  },

  // Create new disbursement
  createDisbursement: async (disbursement: DisbursementRequest): Promise<Disbursement> => {
    const response = await apiClient.post(ENDPOINTS.DISBURSEMENTS.BASE, disbursement);
    return response.data;
  },

  // Update disbursement
  updateDisbursement: async (id: number, disbursement: DisbursementRequest): Promise<Disbursement> => {
    const response = await apiClient.put(`${ENDPOINTS.DISBURSEMENTS.BASE}/${id}`, disbursement);
    return response.data;
  },

  // Delete disbursement
  deleteDisbursement: async (id: number): Promise<void> => {
    await apiClient.delete(`${ENDPOINTS.DISBURSEMENTS.BASE}/${id}`);
  },

  // Process disbursement
  processDisbursement: async (id: number): Promise<Disbursement> => {
    const response = await apiClient.put(`${ENDPOINTS.DISBURSEMENTS.BASE}/${id}/process`);
    return response.data;
  },

  // Complete disbursement
  completeDisbursement: async (id: number, data: DisbursementCompleteRequest): Promise<Disbursement> => {
    const response = await apiClient.put(`${ENDPOINTS.DISBURSEMENTS.BASE}/${id}/complete`, null, {
      params: {
        paymentReference: data.paymentReference
      }
    });
    return response.data;
  },

  // Fail disbursement
  failDisbursement: async (id: number, data: DisbursementFailCancelRequest): Promise<Disbursement> => {
    const response = await apiClient.put(`${ENDPOINTS.DISBURSEMENTS.BASE}/${id}/fail`, null, {
      params: {
        remarks: data.remarks
      }
    });
    return response.data;
  },

  // Cancel disbursement
  cancelDisbursement: async (id: number, data: DisbursementFailCancelRequest): Promise<Disbursement> => {
    const response = await apiClient.put(`${ENDPOINTS.DISBURSEMENTS.BASE}/${id}/cancel`, null, {
      params: {
        remarks: data.remarks
      }
    });
    return response.data;
  },

  // Get disbursement KPIs
  getKPIs: async (): Promise<DisbursementKPI> => {
    const response = await apiClient.get(`${ENDPOINTS.LOAN_DISBURSEMENTS.BASE}/kpi`);
    return response.data.data;
  },
};
