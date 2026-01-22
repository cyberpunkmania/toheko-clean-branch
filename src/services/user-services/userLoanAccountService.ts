import apiClient from '../api';
import { ENDPOINTS } from '../../config/endpoints';

// Types for loan account history
export interface LoanAccount {
  id: number;
  accountNo: string;
  currency: string;
  principalAmount: number;
  outstandingPrincipal: number;
  interestRate: number;
  termDays: number;
  accruedInterest: number;
  accruedPenalty: number;
  phase: string;
  status: string;
  openedAt: string;
  disbursedAt: string | null;
  maturityDate: string;
}

export interface LoanAccountHistoryResponse {
  content: LoanAccount[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Loan account service
export const loanAccountService = {
  // Get loan account history for a member
  getLoanAccountHistory: async (memberId: number, page: number = 0, size: number = 20): Promise<LoanAccountHistoryResponse> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.LOAN_ACCOUNTS.BASE}/member-loan-account-history`, {
        params: { page, size },
        headers: {
          'X-Member-Id': memberId.toString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching loan account history:', error);
      throw error;
    }
  }
};
