// services/accountTypeService.ts
import apiClient from './api';
import { AccountType, AccountTypeDTO, AcknowledgementResponse } from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const accountTypeService = {
  getAllAccountTypes: async (): Promise<AccountType[]> => {
    const response = await apiClient.get(ENDPOINTS.ACCOUNT_TYPES.BASE);
    return response.data.map((item: any) => ({
      id: item.accountTypeId,
      name: item.name,
      description: item.description,
      shortDescription: item.shortDescription || null,
      activationFee: item.activationFee || 0,
      createDate: item.createDate,
      lastModified: item.lastModified,
      createdBy: item.createdBy,
      lastModifiedBy: item.lastModifiedBy,
      version: item.version,
    }));
  },

  getAccountTypeById: async (id: number): Promise<AccountType> => {
    const response = await apiClient.get(`${ENDPOINTS.ACCOUNT_TYPES.BASE}/${id}`);
    const item = response.data;
    return {
      id: item.accountTypeId,
      name: item.name,
      description: item.description,
      shortDescription: item.shortDescription || null,
      activationFee: item.activationFee || 0,
      createDate: item.createDate,
      lastModified: item.lastModified,
      createdBy: item.createdBy,
      lastModifiedBy: item.lastModifiedBy,
      version: item.version,
    };
  },

  createAccountType: async (accountType: AccountTypeDTO): Promise<AcknowledgementResponse> => {
    const response = await apiClient.post(ENDPOINTS.ACCOUNT_TYPES.BASE, accountType);
    return response.data;
  },

  updateAccountType: async (id: number, accountType: AccountTypeDTO): Promise<AcknowledgementResponse> => {
    const response = await apiClient.put(`${ENDPOINTS.ACCOUNT_TYPES.BASE}/${id}`, accountType);
    return response.data;
  },

  deleteAccountType: async (id: number): Promise<AcknowledgementResponse> => {
    const response = await apiClient.delete(`${ENDPOINTS.ACCOUNT_TYPES.BASE}/${id}`);
    return response.data;
  },
};