import axios from 'axios';
import { expireSession } from '@/features/auth/session';
import { authPath, rememberReturnTo, safeReturnTo } from '@/features/auth/utils/auth-redirect';
import { toAppApiError } from '@/lib/api-error';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm JWT token vào authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers && !config.url?.startsWith('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(toAppApiError(error));
  }
);

// Response Interceptor: Xử lý lỗi toàn cục (e.g. 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config;
    if (error.response?.status === 401 && config && !config.url?.startsWith("/auth/")) {
      const authorization = config.headers?.Authorization;
      const requestToken = typeof authorization === "string" && authorization.startsWith("Bearer ")
        ? authorization.slice(7) : "";
      if (expireSession(requestToken)) {
        const target = safeReturnTo(window.location.pathname + window.location.search + window.location.hash);
        rememberReturnTo(target);
        if (target) window.location.replace(authPath("/login", target, true));
      }
    }
    return Promise.reject(toAppApiError(error));
  }
);
