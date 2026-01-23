import apiClient from './api';
import { User, UserDTO, AcknowledgementResponse } from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.USERS.BASE);
      //console.log('Users API response:', response.data);
      return response.data?.content || []; // Assuming paginated response with content array
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getUserById: async (id: number): Promise<User> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.USERS.BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  createUser: async (user: UserDTO): Promise<User> => {
    try {
      const response = await apiClient.post(ENDPOINTS.USERS.BASE, user);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (id: number, user: UserDTO): Promise<User> => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.USERS.BASE}/${id}`, user);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${ENDPOINTS.USERS.BASE}/${id}`);
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  },

  // Additional user-specific methods if needed
  searchUsers: async (query: string): Promise<User[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.USERS.BASE}/search`, {
        params: { query }
      });
      return response.data?.content || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  changeUserStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<User> => {
    try {
      const response = await apiClient.patch(`${ENDPOINTS.USERS.BASE}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing status for user ${id}:`, error);
      throw error;
    }
  }
};