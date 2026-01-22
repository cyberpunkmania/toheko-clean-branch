import apiClient from './api';
import {
  AcknowledgementResponse,
  GenerateScheduleRequest,
  RecordSchedulePaymentRequest,
  RepaymentSchedule,
  RepaymentScheduleRequest,
} from "@/types/api";
import { toast } from "@/components/ui/sonner";
import { ENDPOINTS } from '../config/endpoints';

// Base URL for repayment schedules API
const BASE_URL = ENDPOINTS.REPAYMENT_SCHEDULES.BASE;

// Helper function to handle API errors
const handleApiError = (error: any, customMessage?: string) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (error.response.status === 403) {
      toast.error("You don't have permission to access this resource. Please check your login credentials.");
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.response.status === 401) {
      toast.error("Your session has expired. Please log in again.");
      localStorage.removeItem('token');
      window.location.href = '/login?sessionExpired=true';
    } else {
      toast.error(customMessage || `Error: ${error.response.data.message || 'Something went wrong'}`);
    }
  } else if (error.request) {
    // The request was made but no response was received
    toast.error("Network error. Please check your connection.");
  } else {
    // Something happened in setting up the request that triggered an Error
    toast.error(customMessage || "An unexpected error occurred.");
  }
  
  return { content: [] }; // Return empty data structure
};

// Service functions for handling repayment schedules
export const repaymentScheduleService = {
  // Get all repayment schedules with optional pagination
  getAllSchedules: async (page = 0, size = 10) => {
    try {
      const response = await apiClient.get(BASE_URL, {
        params: {
          pageable: { page, size },
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, "Failed to fetch repayment schedules");
    }
  },

  // Get a specific repayment schedule by ID
  getScheduleById: async (id: number) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch repayment schedule #${id}`);
    }
  },

  // Create a new repayment schedule
  createSchedule: async (scheduleData: RepaymentScheduleRequest) => {
    try {
      const response = await apiClient.post(BASE_URL, scheduleData);
      return response.data;
    } catch (error) {
      return handleApiError(error, "Failed to create repayment schedule");
    }
  },

  // Update an existing repayment schedule
  updateSchedule: async (id: number, scheduleData: RepaymentScheduleRequest) => {
    try {
      const response = await apiClient.put(`${BASE_URL}/${id}`, scheduleData);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to update repayment schedule #${id}`);
    }
  },

  // Delete a repayment schedule
  deleteSchedule: async (id: number) => {
    try {
      const response = await apiClient.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to delete repayment schedule #${id}`);
    }
  },

  // Record a payment for a repayment schedule
  recordPayment: async (id: number, paymentData: RecordSchedulePaymentRequest) => {
    try {
      const response = await apiClient.put(`${BASE_URL}/${id}/record-payment`, paymentData);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to record payment for schedule #${id}`);
    }
  },

  // Generate repayment schedules for a loan
  generateSchedules: async (generateData: GenerateScheduleRequest) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/generate`, generateData);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to generate repayment schedules for loan #${generateData.loanId}`);
    }
  },

  // Get all overdue repayment schedules
  getOverdueSchedules: async () => {
    try {
      const response = await apiClient.get(`${BASE_URL}/overdue`);
      return response.data;
    } catch (error) {
      return handleApiError(error, "Failed to fetch overdue schedules");
    }
  },

  // Get schedules by status
  getSchedulesByStatus: async (status: string) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/by-status/${status}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch schedules with status: ${status}`);
    }
  },

  // Get schedules by loan ID
  getSchedulesByLoanId: async (loanId: number) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/by-loan/${loanId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch schedules for loan #${loanId}`);
    }
  },

  // Delete schedules by loan ID
  deleteSchedulesByLoanId: async (loanId: number) => {
    try {
      const response = await apiClient.delete(`${BASE_URL}/by-loan/${loanId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to delete schedules for loan #${loanId}`);
    }
  },

  // Get schedules by loan ID and status
  getSchedulesByLoanIdAndStatus: async (loanId: number, status: string) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/by-loan/${loanId}/status/${status}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch schedules for loan #${loanId} with status: ${status}`);
    }
  },

  // Get overdue schedules by loan ID
  getOverdueSchedulesByLoanId: async (loanId: number) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/by-loan/${loanId}/overdue`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch overdue schedules for loan #${loanId}`);
    }
  },

  // Get ordered schedules by loan ID
  getOrderedSchedulesByLoanId: async (loanId: number) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/by-loan/${loanId}/ordered`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch ordered schedules for loan #${loanId}`);
    }
  },

  // Get schedules by due date
  getSchedulesByDueDate: async (dueDate: string) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/by-due-date`, {
        params: { dueDate },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch schedules for due date: ${dueDate}`);
    }
  },

  // Get schedules by due date range
  getSchedulesByDueDateRange: async (startDate: string, endDate: string) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/by-due-date-range`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch schedules between ${startDate} and ${endDate}`);
    }
  },
};
