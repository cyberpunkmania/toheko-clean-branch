import apiClient from './api';
import { Role, RoleDTO, AcknowledgementResponse } from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const roleService = {
  getAllRoles: async (): Promise<Role[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.ROLES.BASE);
      console.log('Roles API response:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  getRoleByCode: async (roleCode: number): Promise<Role> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.ROLES.BASE}/${roleCode}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching role with code ${roleCode}:`, error);
      throw error;
    }
  },

  createRole: async (role: RoleDTO): Promise<Role> => {
    try {
      const response = await apiClient.post(ENDPOINTS.ROLES.BASE, role);
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  updateRole: async (roleCode: number, role: RoleDTO): Promise<Role> => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.ROLES.BASE}/${roleCode}`, role);
      return response.data;
    } catch (error) {
      console.error(`Error updating role with code ${roleCode}:`, error);
      throw error;
    }
  },

  deleteRole: async (roleCode: number): Promise<void> => {
    try {
      await apiClient.delete(`${ENDPOINTS.ROLES.BASE}/${roleCode}`);
    } catch (error) {
      console.error(`Error deleting role with code ${roleCode}:`, error);
      throw error;
    }
  }
};
