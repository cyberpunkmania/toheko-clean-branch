import apiClient from './api';
import { AcknowledgementResponse, Member, MemberRequest, SuspensionRequest } from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const memberService = {
  getAllMembers: async (): Promise<Member[]> => {
    const response = await apiClient.get(`${ENDPOINTS.MEMBERS.BASE}/findAll`);
    return response.data.content;
  },

  getMemberById: async (id: number): Promise<Member> => {
    const response = await apiClient.get(`${ENDPOINTS.MEMBERS.BASE}/findByMemberId?memberId=${id}`);
    return response.data;
  },

  createMember: async (member: MemberRequest): Promise<AcknowledgementResponse> => {
    const response = await apiClient.post(`${ENDPOINTS.MEMBERS.BASE}/create`, member);
    return response.data;
  },

  updateMember: async (member: MemberRequest): Promise<AcknowledgementResponse> => {
    const response = await apiClient.put(`${ENDPOINTS.MEMBERS.BASE}/update`, member);
    return response.data;
  },

  suspendMember: async (memberId: number, payload: { reason: string }) => {
    const response = await apiClient.put(`${ENDPOINTS.MEMBERS.BASE}/suspend/${memberId}`, payload);
    return response.data;
  },

  reactivateMember: async (payload: { memmberId: number; activationReason: string }) => {
    const response = await apiClient.put(`${ENDPOINTS.MEMBERS.BASE}/reactivate-member`, payload);
    return response.data;
  },

  deleteMember: async (memberId: number): Promise<AcknowledgementResponse> => {
    const response = await apiClient.delete(`${ENDPOINTS.MEMBERS.BASE}/delete?memberId=${memberId}`);
    return response.data;
  },

  getMemberKpiStats: async (): Promise<any> => {
    const response = await apiClient.get(`${ENDPOINTS.MEMBERS.BASE}/member-registration-kpi-history`);
    return response.data;
  },

  getCounties: async (page = 0, size = 100): Promise<any> => {
    const response = await apiClient.get(`${ENDPOINTS.LOCATION.COUNTIES}/search?page=${page}&size=${size}`);
    return response.data;
  },

  getLocationCounties: async (opts: { page?: number; size?: number } = { page: 0, size: 100 }): Promise<any> => {
    const page = opts.page ?? 0;
    const size = opts.size ?? 100;
    const response = await apiClient.get(`${ENDPOINTS.LOCATION.COUNTIES}/search?page=${page}&size=${size}`);
    return response.data;
  },

  getConstituencies: async (countyCode: string, page = 0, size = 100): Promise<any> => {
    const response = await apiClient.get(`${ENDPOINTS.LOCATION.CONSTITUENCIES}/search?countyCode=${encodeURIComponent(countyCode)}&page=${page}&size=${size}`);
    return response.data;
  },

  getLocationConstituencies: async (countyCode: string, opts: { page?: number; size?: number } = { page: 0, size: 100 }): Promise<any> => {
    const page = opts.page ?? 0;
    const size = opts.size ?? 100;
    const response = await apiClient.get(`${ENDPOINTS.LOCATION.CONSTITUENCIES}/search?countyCode=${encodeURIComponent(countyCode)}&page=${page}&size=${size}`);
    return response.data;
  },

  getWards: async (constituencyCode: string, page = 0, size = 100): Promise<any> => {
    const response = await apiClient.get(`${ENDPOINTS.LOCATION.WARDS}/search?constituencyCode=${encodeURIComponent(constituencyCode)}&page=${page}&size=${size}`);
    return response.data;
  },

  getLocationWards: async (constituencyCode: string, opts: { page?: number; size?: number } = { page: 0, size: 100 }): Promise<any> => {
    const page = opts.page ?? 0;
    const size = opts.size ?? 100;
    const response = await apiClient.get(`${ENDPOINTS.LOCATION.WARDS}/search?constituencyCode=${encodeURIComponent(constituencyCode)}&page=${page}&size=${size}`);
    return response.data;
  },
};