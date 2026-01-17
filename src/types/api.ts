/* eslint-disable @typescript-eslint/no-explicit-any */

import { Interface } from "node:readline";

export interface AcknowledgementResponse {
  id?: number;
  success: boolean;
  message: string;
}

export interface AcknowledgementResponseObject {
  success: boolean;
  message: string;
  object?: any;
}

// Generic Paginated Response Interfaces
export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Pageable {
  offset: number;
  sort: Sort;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PaginatedResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  sort: Sort;
  pageable: Pageable;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
    userFirstname: string,
    userLastname: string,
    userEmail: string,
    userPhoneNumber: string,
    userUsername: string,
    userPassword: string,
    userIdNumber: string,
    roleId: number;
}

export interface AuthenticationResponse {
  access_token: string | null;
  refresh_token: string | null;
  expiresIn?: number;
  userId?: number;
  roles?: string[];
  otp_required?: boolean;
  message?: string;
}

export interface MemberRequest {
  memberId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  dateOfBirth: string;
  address: string;
  status: string;
  countyCode?: string;
  constituencyCode?: string;
  wardCode?: string;
}

export interface Member extends MemberRequest {
  memberNo: string;
  memberId: number;
  registrationDate: string;
}

export interface SuspensionRequest {
  reason: string;
  suspendedUntil?: string;
}

export interface LoanType {
  id: number;
  name: string;
  description: string;
  interestRate: number;
  maxAmount: number;
  minAmount: number;
  maxTenure: number;
  minTenure: number;
  isActive: boolean;
  interestMethod: string;
  status: string;
}

// Applicant Type enum
export type ApplicantType = 'MEMBER' | 'GROUP' | 'LOANEE';

export interface LoanProduct  {
  id: number;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  interestMethod: 'SIMPLE' | 'COMPOUND'; // add other methods if needed
  minTermDays: number;
  maxTermDays: number;
  gracePeriodDays: number;
  requiresCollateral: boolean;
  requiresGuarantor: boolean;
  requiresNextOfKin: boolean;
  allowPenalties: boolean;
  isActive: boolean;
  maxGuarantors: number;
  maxCollateralItems: number;
  applicantType?: ApplicantType;
};

export interface LoanPenaltySetting  {
  id: number;
  loanProductId: number;
  penaltyType: 'NONE' | 'FIXED' | 'PERCENTAGE'; // extend with other types as needed
  penaltyValue: number;
  isActive: boolean;
};

export interface LoanCollateralItem  {
  id: number;
  loanApplicationId: number;
  type: string;
  description: string;
  estimatedValue: number;
  ownerName: string;
  ownerContact: string;
};

export interface LoanApplicationRequest {
  id?: number;
  loanPurpose: string;
  loanApplicationId: number;
  loanApplicationCode: string;
  loanAmount: number;
  memberId: number;
  paymentTypeId: number;
  loanTypeId: number;
  monthlyRepayment: number;
  loanStatus: string;
  dateApplied: string;
  approvedDate: string | null;
  remarks: string;
}

export type LoanGuarantor = {
  id: number;
  loanApplicationId: number;
  guarantorName: string;
  relationship: string;
  guarantorContact: string;
  guarantorIdNumber: string;
  guaranteedAmount: number;
};

export interface LoanPenalty {
  id: number;
  loanProductId: number;
  penaltyType: string;
  penaltyValue: number;
  isActive: boolean;
};



export interface LoanNextOfKin {
  id: number;
  loanApplicationId: number;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
};



export interface LoanApplication {
  loanApplicationId: number;
  loanProductId: number;
  applicantIdNo: number | string;
  memberId: number;
  name: string;
  mobileNumber: string | number | null
  amount: number;
  termDays: number;
  guarantors: LoanGuarantor[];
  nextOfKin: LoanNextOfKin[];
  collateral: LoanCollateralItem[];
  loanApplicationCode?: string;
  status?: string;
  createDate?: string;
};




export interface LoanApprovalRequest {
  id?: number;
  loanApplicationId: number;
  approvedBy: number;
  approvalDate?: string;
  status: string;
  comments?: string;
}

// Common base interface for entities with audit fields
export interface BaseEntityAudit {
  createDate?: string;
  lastModified?: string | null;
  createdBy?: string | number | null;
  lastModifiedBy?: string | number | null;
  version?: number;
}

export interface AccountType extends BaseEntityAudit {
  accountTypeId: number;
  name: string;
  description: string;
  shortDescription: string;
  activationFee: number;
}

export interface Member {
  createdAt: string;
  updatedAt: string;
  version: number;
  memberId: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  position: string | null;
  memberNo: string;
  nationalId: string;
  gender: string | null;
  address: string;
  email: string;
  phoneNumber: string;
  dob: string | null;
  hashedPhoneNumber: string;
  status: string;
  suspensionReason: string | null;
  suspendedAt: string | null;
  reactivatedAt: string | null;
  nextOfKins?: NextOfKin[]; 

}

export interface Account extends BaseEntityAudit {
  accountId: number;
  accountNumber: string;
  name: string;
  shortDescription: string;
  suspensionReason: string | null;
  suspendedAt: string | null;
  reactivatedAt: string | null;
  status: string;
  balance: number;
  paidActivationFee: boolean | null;
  accountType: AccountType;
  member: Member;
}

export interface AccountUpdateDTO {
  name: string;
  shortDescription: string;
  status: string;
}

export interface AccountSuspensionRequest {
  reason: string;
  suspendedUntil?: string;
}

// Group interfaces
export interface Group extends BaseEntityAudit {
  groupId: number;
  groupName: string;
  groupCode: string;
  groupType: string;
  registrationNumber: string;
  phoneNumber: string;
  email: string;
  physicalAddress: string;
  status: string;
  approvedAt?: string | null;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  reactivatedAt?: string | null;
}

export interface GroupRequest {
  groupName: string;
  groupType: string;
  registrationNumber: string;
  phoneNumber: string;
  email: string;
  physicalAddress: string;
  // officials array removed as they are handled separately
}

export interface GroupOfficial extends BaseEntityAudit {
  id: number; // official's unique ID
  name: string;
  description: string;
  groupCode: string; // parent group's code
  groupOfficialCode: string; // official's own code
  email: string;
  phoneNumber: string;
  role: string;
  group: Group; // Nested parent group details
}

export interface GroupOfficialRequest {
  name: string;
  phoneNumber: string;
  email: string;
  role: string;
  groupId: number; // ID of the group this official belongs to
  // description is not part of create/update request based on API docs
}

export interface GroupSuspensionRequest {
  reason: string;
  suspendedUntil?: string;
}

// export interface AccountType {
//   id: number;
//   name: string;
//   description: string;
//   interestRate: number;
//   minimumBalance: number;
//   monthlyFee: number;
//   status: string;
// }

// export interface AccountTypeDTO {
//   name: string;
//   description: string;
//   interestRate: number;
//   minimumBalance: number;
//   monthlyFee: number;
//   status: string;
// }

// types/api.ts (update the existing AccountTypeDTO definition)
export interface AccountType {
  id: number; // Maps to accountTypeId
  name: string;
  description: string;
  shortDescription: string | null;
  activationFee: number;
  createDate?: string;
  lastModified?: string | null;
  createdBy?: number | null;
  lastModifiedBy?: number | null;
  version?: number;
}

export interface AccountTypeDTO {
  name: string;
  description: string;
  shortDescription: string;
  activationFee: number; // Add this field
}
// Payment types
export interface Payment {
  id: number;
  memberId: number;
  amount: number;
  accountId: Account;
  paymentDate: string;
  paymentType: PaymentType;
  modeOfPaymentId: number;
  referenceNumber: string;
  phoneNumber: string;
  description?: string;
  
}

export interface PaymentUpdateDTO {
  amount: number;
  paymentTypeId: number;
  modeOfPaymentId: number;
  referenceNumber: string;
  status: string;
  description?: string;
}

export interface PaymentType {
  paymentTypeId: number;
  name: string;
  paymentShortDesc: string;
  paymentDescription: string;
}

export interface PaymentTypeRequest {
  paymentTypeId: number;
  name: string;
  paymentShortDesc: string;
  paymentDescription: string;
}

// Mode of Payment
export interface ModeOfPayment {
  id?: number;
  modeOfPaymentId: number;
  name: string;
  description: string;
  shortDescription?: string;
  status: string;
}

export interface ModeOfPaymentDto {
  name: string;
  description: string;
  status: string;
}

// Next of Kin
export interface NextOfKin {
  [x: string]: string;
  otherNames: string;
  nationalId: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  birthCertificateNo: string;
  nationality: string;
  // id?: number;
  // nextOfKinId: number;
  // memberId: number;
  // member: Member;
  firstName: string;
  lastName: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  address: string;
  status: string;
}

export interface NextOfKinRequestDTO {
  memberId: number;
  firstName: string;
  lastName: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  address: string;
  nationalId?: string;
  otherNames?: string;
  gender?: string;
}

// Permission types
export interface Permission {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface PermissionDTO {
  name: string;
  description: string;
  status: string;
}

// Board Member types
export interface BoardMember {
  id: number;
  memberId: number;
  position: string;
  createdAt: string;
  endDate?: string;
  status: string;
  createDate?: string| null;
  lastModified?: string | null;
}

export interface BoardMemberRequest {
  id: number;
  memberId: number;
  position: string;
  createdAt: string;
  endDate?: string;
  status: string;
}

// Saving types
export interface Saving {
  id: number;
  memberId: number;
  savingAmount: number;
  savingDate: string;
  savingMethod: string;
  status: string;
}

export interface SavingRequest {
  id: number;
  memberId: number;
  savingAmount: number;
  savingDate: string;
  savingMethod: string;
  status: string;
}

// Role types
export interface Role {
  roleCode: number;
  roleName: string;
  roleShortDesc: string;
  roleDescription: string;
  roleStatus: string;
  createDate?: string;
  lastModified?: string | null;
  createdBy?: number | null;
  lastModifiedBy?: number | null;
  permissions?: Array<{
    id: number;
    permissionName: string;
    permissionDescription: string;
  }>;
  version?: number;
}

export interface RoleDTO {
  roleName: string;
  roleDescription: string;
  roleStatus: string;
  permissionIds?: number[];
}

// Repayment types
export interface Repayment {
  id: number;
  repaymentCode: string;
  loanId: number;
  loanCode: string;
  memberName: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  penalty: number;
  dueDate: string;
  paymentDate: string | null;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'WAIVED' | 'CANCELLED';
  paymentReference: string;
  paymentMethod: string;
  receivedBy: number | null;
  receivedByName: string | null;
  remarks: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  penaltyAmount?: number;
}

export interface RepaymentRequest {
  id?: number;
  repaymentCode?: string;
  loanId: number;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  dueDate: string;
  status?: string;
  paymentReference?: string;
  paymentMethod?: string;
  receivedBy?: number;
  remarks?: string;
}

export interface RecordPaymentRequest {
  id: number;
  amount: number;
  paymentReference: string;
  paymentMethod: string;
  receivedBy: number;
  remarks?: string;
}

export interface WaiveRequest {
  id: number;
  remarks: string;
}

export interface CancelRequest {
  id: number;
  remarks: string;
}

// Disbursement interfaces
export interface Disbursement {
  id: number;
  disbursementCode: string;
  loanApplicationId: number;
  loanApplicationCode: string;
  memberName: string;
  amount: number;
  disbursementDate: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentReference: string;
  paymentMethod: string;
  bankAccount: string;
  mobileNumber: string;
  disbursedBy: number;
  disbursedByName: string;
  remarks: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementRequest {
  id?: number;
  disbursementCode: string;
  loanApplicationId: number;
  amount: number;
  disbursementDate: string;
  status?: string;
  paymentReference?: string;
  paymentMethod: string;
  bankAccount?: string;
  mobileNumber?: string;
  disbursedBy: number;
  remarks?: string;
  isActive?: boolean;
}

export interface DisbursementCompleteRequest {
  id: number;
  paymentReference: string;
}

export interface DisbursementFailCancelRequest {
  id: number;
  remarks: string;
}

// Repayment Schedule interfaces
export interface RepaymentSchedule {
  id: number;
  loanId: number;
  loanCode: string;
  memberName: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingPrincipal: number;
  paidAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'WAIVED' | 'CANCELLED';
  paymentDate: string;
  remarks: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepaymentScheduleRequest {
  id?: number;
  loanId: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingPrincipal: number;
  paidAmount: number;
  status: string;
  paymentDate: string;
  remarks: string;
  isActive: boolean;
}

export interface GenerateScheduleRequest {
  loanId: number;
  loanAmount: number;
  interestRate: number;
  termInMonths: number;
  startDate: string;
  interestMethod: string;
}

export interface RecordSchedulePaymentRequest {
  id: number;
  amount: number;
  paymentDate: string;
  remarks?: string;
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  userStatus: 'ACTIVE' | 'INACTIVE';
  userPhoneNumber: string;
  role: Role; 
}

export interface UserDTO {
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  userStatus: 'ACTIVE' | 'INACTIVE';
  userPhoneNumber: string;
  role: {
    roleCode: number;
  }; 
}

export interface Expense {
  id: number;
  title: string;
  description?: string;
  amount: number;
  categoryId?: number;
  expenseDate?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string | null;
  approvalStatus?: string;
  approvedBy?: number | null;
  approvedAt?: string | null;
  rejectedBy?: number | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string | null;
}