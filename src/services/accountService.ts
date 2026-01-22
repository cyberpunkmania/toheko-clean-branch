
import apiClient from './api';
import { 
  Account, 
  AccountUpdateDTO, 
  AccountSuspensionRequest, 
  AcknowledgementResponse 
} from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

// Interface for creating a new account
export interface CreateAccountRequest {
  memberId: number;
  accountTypeId: number;
  name: string;
  shortDescription: string;
  initialBalance: number;
}

export const accountService = {
  createAccount: async (accountData: CreateAccountRequest): Promise<AcknowledgementResponse> => {
    const response = await apiClient.post(ENDPOINTS.ACCOUNTS.BASE, accountData);
    return response.data;
  },

  getAllAccounts: async (): Promise<Account[]> => {
    const response = await apiClient.get(ENDPOINTS.ACCOUNTS.BASE);
    return response.data.content;
  },

  getAccountById: async (id: number): Promise<Account> => {
    const response = await apiClient.get(`${ENDPOINTS.ACCOUNTS.BASE}/${id}`);
    return response.data;
  },

  updateAccount: async (id: number, account: AccountUpdateDTO): Promise<AcknowledgementResponse> => {
    const response = await apiClient.put(`${ENDPOINTS.ACCOUNTS.BASE}/${id}`, account);
    return response.data;
  },

  deleteAccount: async (id: number): Promise<AcknowledgementResponse> => {
    const response = await apiClient.delete(`${ENDPOINTS.ACCOUNTS.BASE}/${id}`);
    return response.data;
  },

  suspendAccount: async (accountId: number, suspensionRequest: AccountSuspensionRequest): Promise<AcknowledgementResponse> => {
    const response = await apiClient.put(`${ENDPOINTS.ACCOUNTS.BASE}/${accountId}/suspend`, suspensionRequest);
    return response.data;
  },

  activateSuspendedAccount: async (accountId: number): Promise<AcknowledgementResponse> => {
    const response = await apiClient.put(`${ENDPOINTS.ACCOUNTS.BASE}/${accountId}/activate-suspend`);
    return response.data;
  },

  // Get accounts for a specific member
  getMemberAccounts: async (memberId: number): Promise<Account[]> => {
    const response = await apiClient.get(`${ENDPOINTS.ACCOUNTS.BASE}/member/${memberId}`);
    return response.data.content || response.data;
  }
};
