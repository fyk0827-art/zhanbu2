import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  AgeGroup,
  QuestionDTO,
  AdminQuestionDTO,
  AnswerDTO,
  PageDTO,
  LoginRequest,
  LoginResponse,
  SubmitAnswerRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentCompleteRequest,
  PaymentCompleteResponse,
  PublicSettings,
  AdminSettings,
  UpdateSettingsRequest,
} from "@/types/api";

// 默认走相对路径 /api，由 Vite 代理到本机后端；内网其他电脑访问时勿写死 localhost
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "";

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor - attach admin token when available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Response interceptor - extract data
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("adminToken");
    }
    return Promise.reject(error);
  }
);

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.post<ApiResponse<T>>(url, data);
  if (!res.data.success) {
    throw new Error(res.data.message || "Request failed");
  }
  return res.data.data;
}

async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<ApiResponse<T>>(url, data);
  if (!res.data.success) {
    throw new Error(res.data.message || "Request failed");
  }
  return res.data.data;
}

async function del<T>(url: string): Promise<T> {
  const res = await apiClient.delete<ApiResponse<T>>(url);
  return res.data.data;
}

// ======== Auth API ========
export const authApi = {
  login: (req: LoginRequest) => post<LoginResponse>("/admin/login", req),
  me: () => get<string>("/admin/me"),
};

// ======== Age Group API ========
export const ageGroupApi = {
  list: () => get<AgeGroup[]>("/age-groups"),
  setUnifiedPrice: (price: number) =>
    put<void>("/age-groups/admin/price", { price }),
};

// ======== Settings API ========
export const settingsApi = {
  getPublic: () => get<PublicSettings>("/settings/public"),
};

export const adminSettingsApi = {
  get: () => get<AdminSettings>("/admin/settings"),
  update: (req: UpdateSettingsRequest) => put<AdminSettings>("/admin/settings", req),
};

// ======== Question API ========
export const questionApi = {
  list: (ageGroupId: number, language: string) =>
    get<QuestionDTO[]>("/questions", { ageGroupId, language }),
  submitAnswer: (req: SubmitAnswerRequest) =>
    post<number>("/questions/answer", req),
};

// ======== Admin Question API ========
export const adminQuestionApi = {
  list: () => get<AdminQuestionDTO[]>("/admin/questions"),
  create: (req: CreateQuestionRequest) =>
    post<number>("/admin/questions", req),
  update: (id: number, req: CreateQuestionRequest) =>
    put<void>(`/admin/questions/${id}`, req),
  delete: (id: number) => del<void>(`/admin/questions/${id}`),
};

// ======== Answer API ========
export const answerApi = {
  adminList: (page: number = 1, pageSize: number = 20) =>
    get<PageDTO<AnswerDTO>>("/admin/answers", { page, pageSize }),
};

// ======== Payment API (server-side mock/live) ========
export const paymentApi = {
  create: (req: PaymentCreateRequest) =>
    post<PaymentCreateResponse>("/payments/create", req),
  complete: (req: PaymentCompleteRequest) =>
    post<PaymentCompleteResponse>("/payments/complete", req),
};

// ======== Admin Orders API ========
export interface AdminOrder {
  orderId: string;
  reportId: string;
  amount: number;
  amountYuan: string;
  title: string;
  channel: string;
  status: string;
  tradeNo: string | null;
  payerContact: string | null;
  location: string | null;
  createdAt: number;
  paidAt: number | null;
}

export interface AdminOrdersResponse {
  items: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminOrdersApi = {
  list: (page: number = 1, pageSize: number = 50) =>
    apiClient.get<AdminOrdersResponse>("/admin/orders", { params: { page, pageSize } })
      .then((res) => res.data),
};

export default apiClient;
