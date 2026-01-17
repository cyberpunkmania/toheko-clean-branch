import apiClient from '../api';

// Applicant Type enum
export type ApplicantType = 'MEMBER' | 'GROUP' | 'LOANEE';

// Loan Product Interface
export interface LoanProduct {
  createDate: string;
  lastModified: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
  version: number;
  id: number;
  name: string;
  loanProductCode: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  interestMethod: 'SIMPLE' | 'COMPOUND';
  minTermDays: number;
  maxTermDays: number;
  gracePeriodDays: number;
  requiresCollateral: boolean;
  requiresGuarantor: boolean;
  requiresNextOfKin: boolean;
  allowPenalties: boolean;
  isActive: boolean;
  maxGuarantors: number | null;
  minGuarantors: number | null;
  maxCollateralItems: number | null;
  minCollateralItems: number | null;
  minNextOfKin: number | null;
  maxNextOfKin: number | null;
  status: string | null;
  statusReason: string | null;
  applicantType?: ApplicantType;
}

// Loan Application Request
export interface LoanApplicationRequest {
  loanProductId: number;
  applicationNo: string;
  memberId: number;
  amount: number;
  firstName: string;
  lastName: string;
  middleName: string;
  termDays: number;
  email: string;
  groupId: number;
  mobileNumber: string;
  address: string;
  occupation: string;
  dob: string;
  gender: string;
  loanPurpose: string;
  status: string;
}

// Loan Application Status Summary
export interface LoanApplicationStatusSummary {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  disbursed: number;
}

// Loan Application Response
export interface LoanApplicationResponse {
  responseCode: string;
  message: string;
  timestamp: string;
  requestId: string;
  data: {
    loanApplicationId: number;
    loanApplicationCode: string;
    guarantorRequired: boolean;
    collateralRequired: boolean;
    requiresNextOfKin: boolean;
    status: string;
    loanProductName: string;
  };
}

// Guarantor Interface
export interface GuarantorRequest {
  id?: number;
  loanApplicationId: number;
  guarantorName: string;
  relationship: string;
  guarantorContact: string;
  guarantorIdNumber: string;
  guaranteedAmount: number;
  memberCode: string;
}

// Collateral Interface
export interface CollateralRequest {
  id?: number;
  loanApplicationId: number;
  type: string;
  description: string;
  estimatedValue: number;
  ownerName: string;
  ownerContact: string;
  memberCode: string;
}

// Next of Kin Interface
export interface NextOfKinRequest {
  id?: number;
  loanApplicationId: number;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  memberCode: string;
}

// Response interfaces
export interface ApiResponse<T> {
  responseCode: string;
  message: string;
  timestamp: string;
  requestId: string;
  data: T;
}

export interface GuarantorResponse {
  guarantorId: number;
  status: string;
}

export interface CollateralResponse {
  collateralId: number;
  status: string;
}

export interface NextOfKinResponse {
  nextOfKinId: number;
  status: string;
}

export interface LoanProductsResponse {
  content: LoanProduct[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// User loan service
export const userLoanService = {
  // Get all loan products (legacy method)
  getLoanProducts: async (page = 0, size = 20): Promise<LoanProductsResponse> => {
    try {
      const response = await apiClient.get(`/api/v1/loan-products/getAll?page=${page}&size=${size}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching loan products:', error);
      throw error;
    }
  },

  // Get active loan products filtered by applicant type (MEMBER, LOANEE, GROUP)
  getActiveLoanProductsByApplicantType: async (applicantType: ApplicantType, page = 0, size = 20): Promise<LoanProductsResponse> => {
    try {
      const response = await apiClient.get(`/api/v1/loan-products/active?page=${page}&size=${size}`, {
        headers: {
          'Applicant-Type': applicantType
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching loan products by applicant type:', error);
      throw error;
    }
  },

  // Create loan application
  createLoanApplication: async (applicationData: LoanApplicationRequest): Promise<LoanApplicationResponse> => {
    try {
      const response = await apiClient.post('/api/v1/loan-applications/create', applicationData);
      return response.data;
    } catch (error) {
      console.error('Error creating loan application:', error);
      throw error;
    }
  },

  // Add guarantor
  addGuarantor: async (guarantorData: GuarantorRequest): Promise<ApiResponse<GuarantorResponse>> => {
    try {
      const response = await apiClient.post('/api/v1/loan-guarantors/create', guarantorData);
      return response.data;
    } catch (error) {
      console.error('Error adding guarantor:', error);
      throw error;
    }
  },

  // Add collateral
  addCollateral: async (collateralData: CollateralRequest): Promise<ApiResponse<CollateralResponse>> => {
    try {
      const response = await apiClient.post('/api/v1/loan-collaterals', collateralData);
      return response.data;
    } catch (error) {
      console.error('Error adding collateral:', error);
      throw error;
    }
  },

  // Add next of kin
  addNextOfKin: async (nextOfKinData: NextOfKinRequest): Promise<ApiResponse<NextOfKinResponse>> => {
    try {
      const response = await apiClient.post('/api/v1/loan-next-of-kin', nextOfKinData);
      return response.data;
    } catch (error) {
      console.error('Error adding next of kin:', error);
      throw error;
    }
  },

  // Get loan application status summary
  getLoanApplicationStatusSummary: async (memberId: number): Promise<LoanApplicationStatusSummary> => {
    try {
      const response = await apiClient.get(`/api/v1/loan-applications/status-summary/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan application status summary:', error);
      throw error;
    }
  }
};
