import axios from 'axios';
import { toast } from "@/components/ui/sonner";
// Base URL for API requests from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Endpoints that don't require authentication (from environment)
const PUBLIC_ENDPOINTS = [
  import.meta.env.VITE_API_AUTH_AUTHENTICATE,
  import.meta.env.VITE_API_AUTH_REGISTER,
  import.meta.env.VITE_API_AUTH_REFRESH_TOKEN,
  import.meta.env.VITE_API_OTP_VERIFY,
  import.meta.env.VITE_API_OTP_SEND,
  import.meta.env.VITE_API_FORGOT_PASSWORD,
  import.meta.env.VITE_API_FORGOT_PASSWORD_VERIFY_MAIL,
  import.meta.env.VITE_API_FORGOT_PASSWORD_VERIFY_OTP,
  import.meta.env.VITE_API_FORGOT_PASSWORD_CHANGE,
].filter(Boolean);
// Helper function to check if an endpoint is public
const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Request interceptor to add token to protected endpoints
apiClient.interceptors.request.use(
  (config) => {
    // Only add token for non-public endpoints
    if (!isPublicEndpoint(config.url)) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if it's a public endpoint (e.g., login failure)
      if (!isPublicEndpoint(error.config?.url)) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/login?sessionExpired=true";
      }
    }
    return Promise.reject(error);
  }
);
export default apiClient;