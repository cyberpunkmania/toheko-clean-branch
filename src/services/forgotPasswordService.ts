import axios from 'axios';
import apiClient from './api';
import { ENDPOINTS } from '../config/endpoints';

const API_BASE_URL = apiClient.defaults.baseURL;

// Create a separate axios instance for public endpoints (no token required)
const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const forgotPasswordService = {
  verifyEmail: async (email: string) => {
    const response = await publicApiClient.post(`${ENDPOINTS.FORGOT_PASSWORD.VERIFY_MAIL}/${email}`);
    return response;
  },

  verifyOtp: async (email: string, otp: number) => {
    const response = await publicApiClient.post(`${ENDPOINTS.FORGOT_PASSWORD.VERIFY_OTP}/${otp}/${email}`);
    return response;
  },

  changePassword: async (email: string, password: string) => {
    const response = await publicApiClient.post(`${ENDPOINTS.FORGOT_PASSWORD.CHANGE_PASSWORD}/${email}`, {
      password,
      repeatPassword: password,
    });
    return response;
  },
};