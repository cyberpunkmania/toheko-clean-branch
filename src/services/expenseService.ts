import apiClient from "./api";
import { Expense } from "@/types/api";
import { ENDPOINTS } from "@/config/endpoints";

export const expenseService = {
  getExpenses: async (page = 0, size = 10, sort = "createdAt,DESC") => {
    const resp = await apiClient.get(`${ENDPOINTS.EXPENSES.BASE}?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`);
    return resp.data?.data ?? resp.data;
  },

  getExpenseById: async (id: number) => {
    const resp = await apiClient.get(`${ENDPOINTS.EXPENSES.BASE}/${id}`);
    return resp.data?.data ?? resp.data;
  },

  createExpense: async (payload: { title: string; description?: string; amount: number; categoryId?: number }) => {
    const userId = localStorage.getItem("userId");
    const headers: any = {};
    if (userId) headers.userId = String(userId);
    const resp = await apiClient.post(ENDPOINTS.EXPENSES.BASE, payload, { headers });
    return resp.data?.data ?? resp.data;
  },

  updateExpense: async (id: number, payload: { title: string; description?: string; amount: number; categoryId?: number }) => {
    const resp = await apiClient.put(`${ENDPOINTS.EXPENSES.BASE}/${id}`, payload);
    return resp.data?.data ?? resp.data;
  },

  deleteExpense: async (id: number) => {
    const resp = await apiClient.delete(`${ENDPOINTS.EXPENSES.BASE}/${id}`);
    return resp.data;
  },
  approveExpense: async (
    id: number,
    action: "APPROVE" | "REJECT",
    approverId: number,
    rejectionReason?: string
  ) => {
    return apiClient.post(`${ENDPOINTS.EXPENSES.BASE}/${id}/approve`, {
      expenseId: id,
      action,
      approverId,
      rejectionReason: action === "REJECT" ? rejectionReason ?? "Not specified" : null,
    }, {
      headers: {
        "Content-Type": "application/json",
        userId: localStorage.getItem("userId") ?? "",
      },
    });
  },
    getExpenseKpis: async () => {
    const res = await apiClient.get(`${ENDPOINTS.EXPENSE_KPI.BASE}/range`);
    return res.data;
  },
};