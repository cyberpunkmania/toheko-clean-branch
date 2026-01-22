
import apiClient from './api';
import { 
  Permission,
  PermissionDTO,
  AcknowledgementResponse 
} from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const permissionService = {
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get(ENDPOINTS.PERMISSIONS.BASE);
    return response.data;
  },

  getPermissionById: async (id: number): Promise<Permission> => {
    const response = await apiClient.get(`${ENDPOINTS.PERMISSIONS.BASE}/${id}`);
    return response.data;
  },

  updatePermission: async (id: number, permission: PermissionDTO): Promise<Permission> => {
    const response = await apiClient.put(`${ENDPOINTS.PERMISSIONS.BASE}/${id}`, permission);
    return response.data;
  },

  deletePermission: async (id: number): Promise<void> => {
    await apiClient.delete(`${ENDPOINTS.PERMISSIONS.BASE}/${id}`);
  }
};
