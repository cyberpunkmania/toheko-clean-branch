import apiClient from "./api";
import { ENDPOINTS } from "@/config/endpoints";

export const expenseCategoryService = {
  getCategories: async (page = 0, size = 10, sort = "createdAt,DESC") => {
    const resp = await apiClient.get(
      `${ENDPOINTS.EXPENSE_CATEGORIES.BASE}?page=${page}&size=${size}&sort=${encodeURIComponent(
        sort
      )}`
    );
    return resp.data?.data ?? resp.data;
  },

  getCategoryById: async (id: number) => {
    const resp = await apiClient.get(`${ENDPOINTS.EXPENSE_CATEGORIES.BASE}/${id}`);
    return resp.data?.data ?? resp.data;
  },

  createCategory: async (
    payload: { name: string; description?: string }
  ) => {
    const userId = localStorage.getItem("userId");
    const headers: any = {};
    if (userId) headers.userId = String(userId);
    const resp = await apiClient.post(
      ENDPOINTS.EXPENSE_CATEGORIES.BASE,
      payload,
      { headers }
    );
    return resp.data?.data ?? resp.data;
  },

  updateCategory: async (id: number, payload: { name: string; description?: string }) => {
    const resp = await apiClient.put(
      `${ENDPOINTS.EXPENSE_CATEGORIES.BASE}/${id}`,
      payload
    );
    return resp.data?.data ?? resp.data;
  },

  deleteCategory: async (id: number) => {
    const resp = await apiClient.delete(`${ENDPOINTS.EXPENSE_CATEGORIES.BASE}/${id}`);
    return resp.data;
  },
};