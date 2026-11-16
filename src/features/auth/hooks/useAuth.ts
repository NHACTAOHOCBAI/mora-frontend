import { useSyncExternalStore } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../services/auth-api";
import { useNavigate } from "react-router-dom";
import { getSession, subscribeSession, setSessionToken } from "../session";
import { authPath, clearReturnTo, pendingReturnTo, rememberReturnTo } from "../utils/auth-redirect";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const session = useSyncExternalStore(subscribeSession, getSession);
  const query = useQuery({
    queryKey: ["currentUser", session.revision],
    queryFn: ({ signal }) => authApi.getCurrentUser(signal),
    enabled: !!session.token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: data => { setSessionToken(data.token); },
  });
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => navigate(authPath("/login", pendingReturnTo()), { replace: true }),
  });
  const logout = (returnTo?: string) => {
    clearReturnTo();
    if (returnTo) rememberReturnTo(returnTo);
    localStorage.removeItem("originalToken");
    setSessionToken(null, !returnTo);
    queryClient.clear();
    navigate(authPath("/login", returnTo), { replace: true });
  };
  return {
    token: session.token, expired: session.expired, explicitLogout: session.explicitLogout,
    user: session.token ? query.data : undefined,
    isAuthenticated: !!session.token && !!query.data,
    isLoading: !!session.token && query.isPending,
    isFetching: query.isFetching, error: query.error, retrySession: query.refetch,
    login: loginMutation.mutateAsync, isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync, isRegistering: registerMutation.isPending,
    registerError: registerMutation.error, logout,
  };
};
