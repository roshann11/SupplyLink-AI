const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

export type ApiError = {
  detail: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "An unexpected error occurred",
    }));
    throw new Error(error.detail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: "GET" }, token),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, token),
  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }, token),
  delete: <T>(path: string, token?: string) => request<T>(path, { method: "DELETE" }, token),
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type UserResponse = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company: {
    id: string;
    name: string;
    slug: string;
    company_type: string;
    is_verified: boolean;
  };
};

export type CompanyDetailsResponse = {
  id: string;
  name: string;
  slug: string;
  company_type: string;
  description: string | null;
  country: string | null;
  city: string | null;
  is_verified: boolean;
};

export type ProductResponse = {
  id: string;
  company_id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number | null;
  currency: string;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type QuoteResponse = {
  id: string;
  rfq_id: string;
  company_id: string;
  created_by_id: string;
  price: number;
  lead_time_days: number;
  notes: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
};

export type RFQResponse = {
  id: string;
  company_id: string;
  created_by_id: string;
  title: string;
  description: string;
  quantity: number;
  target_price: number | null;
  status: "draft" | "open" | "closed" | "awarded";
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  quotes: QuoteResponse[];
};

export type MessageResponse = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type ConversationContactResponse = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
};

export type ReviewResponse = {
  id: string;
  company_id: string;
  reviewer_company_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyRatingSummary = {
  average_rating: number;
  review_count: number;
};

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>("/auth/login", { email, password }),
  register: (data: Record<string, string>) =>
    apiClient.post<UserResponse>("/auth/register", data),
  me: (token: string) => apiClient.get<UserResponse>("/auth/me", token),
};

export const companiesApi = {
  me: (token: string) => apiClient.get<CompanyDetailsResponse>("/companies/me", token),
  updateMe: (data: any, token: string) => apiClient.put<CompanyDetailsResponse>("/companies/me", data, token),
  statsMe: (token: string) => apiClient.get<any>("/companies/me/stats", token),
};

export const productsApi = {
  listActive: (token?: string) => apiClient.get<ProductResponse[]>("/products", token),
  listMy: (token: string) => apiClient.get<ProductResponse[]>("/products/my", token),
  create: (data: any, token: string) => apiClient.post<ProductResponse>("/products", data, token),
  update: (id: string, data: any, token: string) => apiClient.put<ProductResponse>(`/products/${id}`, data, token),
  delete: (id: string, token: string) => apiClient.delete<any>(`/products/${id}`, token),
};

export const rfqsApi = {
  listOpen: (token: string) => apiClient.get<RFQResponse[]>("/rfqs", token),
  listMy: (token: string) => apiClient.get<RFQResponse[]>("/rfqs/my", token),
  create: (data: any, token: string) => apiClient.post<RFQResponse>("/rfqs", data, token),
  get: (id: string, token: string) => apiClient.get<RFQResponse>(`/rfqs/${id}`, token),
  submitQuote: (rfqId: string, data: any, token: string) => apiClient.post<QuoteResponse>(`/rfqs/${rfqId}/quotes`, data, token),
  listQuotes: (rfqId: string, token: string) => apiClient.get<QuoteResponse[]>(`/rfqs/${rfqId}/quotes`, token),
  awardQuote: (rfqId: string, quoteId: string, token: string) => apiClient.post<RFQResponse>(`/rfqs/${rfqId}/quotes/${quoteId}/award`, {}, token),
};

export const messagesApi = {
  send: (data: { receiver_id: string; content: string }, token: string) =>
    apiClient.post<MessageResponse>("/messages", data, token),
  history: (otherId: string, token: string) =>
    apiClient.get<MessageResponse[]>(`/messages/history/${otherId}`, token),
  conversations: (token: string) =>
    apiClient.get<ConversationContactResponse[]>("/messages/conversations", token),
};

export const reviewsApi = {
  create: (companyId: string, data: { rating: number; comment?: string }, token: string) =>
    apiClient.post<ReviewResponse>(`/reviews/company/${companyId}`, data, token),
  list: (companyId: string, token?: string) =>
    apiClient.get<ReviewResponse[]>(`/reviews/company/${companyId}`, token),
  summary: (companyId: string, token?: string) =>
    apiClient.get<CompanyRatingSummary>(`/reviews/company/${companyId}/summary`, token),
};
