export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
}

export interface AuthPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// handle concurrent order cancellations - revision 32
