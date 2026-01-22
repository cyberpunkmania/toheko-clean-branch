// Centralized API endpoints configuration
// All endpoints are loaded from environment variables

export const ENDPOINTS = {
  AUTH: {
    AUTHENTICATE: import.meta.env.VITE_API_AUTH_AUTHENTICATE || '/api/v1/auth/authenticate',
    REGISTER: import.meta.env.VITE_API_AUTH_REGISTER || '/api/v1/auth/register',
    REFRESH_TOKEN: import.meta.env.VITE_API_AUTH_REFRESH_TOKEN || '/api/v1/auth/refresh-token',
  },
  OTP: {
    VERIFY: import.meta.env.VITE_API_OTP_VERIFY || '/api/v1/otp/verify',
    SEND: import.meta.env.VITE_API_OTP_SEND || '/api/v1/otp/send',
  },
  FORGOT_PASSWORD: {
    BASE: import.meta.env.VITE_API_FORGOT_PASSWORD || '/api/v1/forgotPassword',
    VERIFY_MAIL: import.meta.env.VITE_API_FORGOT_PASSWORD_VERIFY_MAIL || '/api/v1/forgotPassword/verifyMail',
    VERIFY_OTP: import.meta.env.VITE_API_FORGOT_PASSWORD_VERIFY_OTP || '/api/v1/forgotPassword/verifyOtp',
    CHANGE_PASSWORD: import.meta.env.VITE_API_FORGOT_PASSWORD_CHANGE || '/api/v1/forgotPassword/changePassword',
  },

  USERS: {
    BASE: import.meta.env.VITE_API_USERS || '/api/v1/users',
  },
  MEMBERS: {
    BASE: import.meta.env.VITE_API_MEMBERS || '/api/v1/members',
  },
  ACCOUNTS: {
    BASE: import.meta.env.VITE_API_ACCOUNTS || '/api/v1/accounts',
  },
  ACCOUNT_TYPES: {
    BASE: import.meta.env.VITE_API_ACCOUNT_TYPES || '/api/v1/account-types',
  },
  SAVINGS: {
    BASE: import.meta.env.VITE_API_SAVINGS || '/api/v1/saving',
  },
  ROLES: {
    BASE: import.meta.env.VITE_API_ROLES || '/api/v1/roles',
  },
  PERMISSIONS: {
    BASE: import.meta.env.VITE_API_PERMISSIONS || '/api/v1/permissions',
  },
  PAYMENTS: {
    BASE: import.meta.env.VITE_API_PAYMENTS || '/api/v1/payments',
  },
  PAYMENT_TYPES: {
    BASE: import.meta.env.VITE_API_PAYMENT_TYPES || '/api/v1/paymentTypes',
  },
  MODE_OF_PAYMENTS: {
    BASE: import.meta.env.VITE_API_MODE_OF_PAYMENTS || '/api/v1/mode-of-payments',
  },
  MPESA: {
    STK: import.meta.env.VITE_API_MPESA_STK || '/api/v1/result/request/lipampesa',
  },
  RESULT: {
    BASE: import.meta.env.VITE_API_RESULT || '/api/v1/result',
  },
  NEXT_OF_KIN: {
    BASE: import.meta.env.VITE_API_NEXT_OF_KIN || '/api/v1/next-of-kin',
  },
  GROUPS: {
    BASE: import.meta.env.VITE_API_GROUPS || '/api/v1/groups',
  },
  GROUP_OFFICIALS: {
    BASE: import.meta.env.VITE_API_GROUP_OFFICIALS || '/api/v1/group-officials',
  },
  LOANS: {
    BASE: import.meta.env.VITE_API_LOANS || '/api/v1/loans',
  },
  LOAN_PRODUCTS: {
    BASE: import.meta.env.VITE_API_LOAN_PRODUCTS || '/api/v1/loan-products',
  },
  LOAN_APPLICATIONS: {
    BASE: import.meta.env.VITE_API_LOAN_APPLICATIONS || '/api/v1/loan-applications',
  },
  LOAN_ACCOUNTS: {
    BASE: import.meta.env.VITE_API_LOAN_ACCOUNTS || '/api/v1/loan-accounts',
  },
  LOAN_GUARANTORS: {
    BASE: import.meta.env.VITE_API_LOAN_GUARANTORS || '/api/v1/loan-guarantors',
  },
  LOAN_COLLATERALS: {
    BASE: import.meta.env.VITE_API_LOAN_COLLATERALS || '/api/v1/loan-collaterals',
  },
  LOAN_NEXT_OF_KIN: {
    BASE: import.meta.env.VITE_API_LOAN_NEXT_OF_KIN || '/api/v1/loan-next-of-kin',
  },
  LOAN_PENALTIES: {
    BASE: import.meta.env.VITE_API_LOAN_PENALTIES || '/api/v1/loan-penalties',
  },
  LOAN_APPROVALS: {
    BASE: import.meta.env.VITE_API_LOAN_APPROVALS || '/api/v1/loan-approvals',
  },
  LOAN_APPLICATIONS_APPROVALS: {
    BASE: import.meta.env.VITE_API_LOAN_APPLICATIONS_APPROVALS || '/api/v1/loan-applications-approvals',
  },
  LOAN_DISBURSEMENTS: {
    BASE: import.meta.env.VITE_API_LOAN_DISBURSEMENTS || '/api/v1/loan-disbursements',
  },
  REPAYMENTS: {
    BASE: import.meta.env.VITE_API_REPAYMENTS || '/api/v1/repayments',
  },
  REPAYMENT_SCHEDULES: {
    BASE: import.meta.env.VITE_API_REPAYMENT_SCHEDULES || '/api/v1/repayment-schedules',
  },
  EXPENSES: {
    BASE: import.meta.env.VITE_API_EXPENSES || '/api/v1/expenses',
  },
  EXPENSE_CATEGORIES: {
    BASE: import.meta.env.VITE_API_EXPENSE_CATEGORIES || '/api/v1/expense-categories',
  },
  EXPENSE_KPI: {
    BASE: import.meta.env.VITE_API_EXPENSE_KPI || '/api/v1/expense-kpi',
  },
  BOARD_MEMBERS: {
    BASE: import.meta.env.VITE_API_BOARD_MEMBERS || '/api/v1/board-members',
    CREATE: import.meta.env.VITE_API_BOARD_MEMBERS_CREATE || '/api/v1/create/board-members',
    UPDATE: import.meta.env.VITE_API_BOARD_MEMBERS_UPDATE || '/api/v1/update/board-members',
    DELETE: import.meta.env.VITE_API_BOARD_MEMBERS_DELETE || '/api/v1/delete/board-members',
    GET_BY_ID: import.meta.env.VITE_API_BOARD_MEMBERS_GET || '/api/v1/getBoardMemberById',
  },
  LOCATION: {
    COUNTIES: import.meta.env.VITE_API_LOCATION_COUNTIES || '/api/v1/location/counties',
    CONSTITUENCIES: import.meta.env.VITE_API_LOCATION_CONSTITUENCIES || '/api/v1/location/constituencies',
    WARDS: import.meta.env.VITE_API_LOCATION_WARDS || '/api/v1/location/wards',
  },
  DISBURSEMENTS: {
    BASE: '/api/v1/disbursements',
    LOAN_DISBURSEMENTS: '/api/v1/loan-disbursements',
  },
};

export default ENDPOINTS;
