import apiClient from './api';
import { BoardMember, BoardMemberRequest, AcknowledgementResponse } from '../types/api';
import { ENDPOINTS } from '../config/endpoints';

export const boardMemberService = {
  // Get all board members with optional query parameters
  getAllBoardMembers: async (params?: {
    position?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
    startDate?: string;
    endDate?: string;
  }): Promise<BoardMember[]> => {
    const response = await apiClient.get(ENDPOINTS.BOARD_MEMBERS.BASE, { params });
    return response.data;
  },
  
  // Get a specific board member by ID
  getBoardMemberById: async (id: number): Promise<BoardMember> => {
    const response = await apiClient.get(ENDPOINTS.BOARD_MEMBERS.GET_BY_ID, {
      params: { boardMemberId: id }
    });
    return response.data;
  },
  
  // Create a new board member
  createBoardMember: async (boardMember: BoardMemberRequest): Promise<AcknowledgementResponse> => {
    const response = await apiClient.post(ENDPOINTS.BOARD_MEMBERS.CREATE, boardMember);
    return response.data;
  },
  
  // Update an existing board member
  updateBoardMember: async (boardMember: BoardMemberRequest): Promise<AcknowledgementResponse> => {
    const response = await apiClient.put(ENDPOINTS.BOARD_MEMBERS.UPDATE, boardMember);
    return response.data;
  },
  
  // Delete a board member
  deleteBoardMember: async (id: number): Promise<AcknowledgementResponse> => {
    const response = await apiClient.delete(ENDPOINTS.BOARD_MEMBERS.DELETE, {
      params: { boardMemberId: id }
    });
    return response.data;
  }
};


