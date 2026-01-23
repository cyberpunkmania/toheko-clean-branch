import apiClient from '../api';
import { ENDPOINTS } from '../../config/endpoints';

// Next of Kin interface matching the API response
export interface UserNextOfKin {
  nextOfKinId: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  nationalId: string;
  gender: string | null;
  address: string;
  email: string;
  phoneNumber: string;
  dob: string | null;
  status: string | null;
  birthCertificateNo: string | null;
  relationship: string;
  nationality: string | null;
  createDate: string;
  lastModified: string;
}

export interface NextOfKinCreateRequest {
  firstName: string;
  lastName: string;
  otherNames?: string;
  nationalId?: string;
  gender?: string;
  address?: string;
  email?: string;
  phoneNumber: string;
  dob?: string;
  status?: string;
  birthCertificateNo?: string;
  relationship: string;
  nationality?: string;
  memberId: number;
}

export interface NextOfKinUpdateRequest {
  firstName: string;
  lastName: string;
  otherNames?: string;
  nationalId?: string;
  gender?: string;
  address?: string;
  email?: string;
  phoneNumber: string;
  dob?: string;
  status?: string;
  birthCertificateNo?: string;
  relationship: string;
  nationality?: string;
  memberId: number;
}

export const userNextOfKinService = {
  // Get all next of kin for a member
  getNextOfKinByMember: async (memberId: number): Promise<UserNextOfKin[]> => {
    //console.log('Fetching next of kin for member:', memberId);
    const response = await apiClient.get(`${ENDPOINTS.NEXT_OF_KIN.BASE}/member/${memberId}`);
    //console.log('Next of kin response:', response.data);
    return response.data || [];
  },

  // Create a new next of kin
  createNextOfKin: async (request: NextOfKinCreateRequest): Promise<any> => {
    //console.log('Creating next of kin:', request);
    const response = await apiClient.post(ENDPOINTS.NEXT_OF_KIN.BASE, request);
    //console.log('Create response:', response.data);
    return response.data;
  },

  // Update an existing next of kin
  updateNextOfKin: async (nextOfKinId: number, request: NextOfKinUpdateRequest): Promise<any> => {
    //console.log('Updating next of kin:', nextOfKinId, request);
    const response = await apiClient.put(`${ENDPOINTS.NEXT_OF_KIN.BASE}/${nextOfKinId}`, request);
    //console.log('Update response:', response.data);
    return response.data;
  },

  // Delete a next of kin
  deleteNextOfKin: async (nextOfKinId: number): Promise<any> => {
    //console.log('Deleting next of kin:', nextOfKinId);
    const response = await apiClient.delete(`${ENDPOINTS.NEXT_OF_KIN.BASE}/${nextOfKinId}`);
    //console.log('Delete response:', response.data);
    return response.data;
  },
};
