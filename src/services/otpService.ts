import apiClient from './api';
import { ENDPOINTS } from '../config/endpoints';

interface OTPVerifyRequest {
  email: string;
  otp: string;
}

interface OTPSendRequest {
  email: string;
}

interface OTPResponse {
  responseCode: string;
  message: string;
  timestamp: string;
  requestId: string;
  data: any;
}

export const otpService = {
  verifyOTP: async (request: OTPVerifyRequest): Promise<OTPResponse> => {
    //console.log("OTP Service - Verifying OTP:", request);
    const response = await apiClient.post(ENDPOINTS.OTP.VERIFY, request);
    //console.log("OTP Service - Verify Response:", response.data);
    return response.data;
  },

  sendOTP: async (request: OTPSendRequest): Promise<OTPResponse> => {
    //console.log("OTP Service - Sending OTP:", request);
    const response = await apiClient.post(ENDPOINTS.OTP.SEND, request);
    //console.log("OTP Service - Send Response:", response.data);
    return response.data;
  },
};
