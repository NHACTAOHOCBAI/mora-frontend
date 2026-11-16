import { useMutation } from "@tanstack/react-query";
import { authApi } from "../services/auth-api";

export const useForgotPassword = () => useMutation({ mutationFn: authApi.forgotPassword });
export const useResetPassword = () => useMutation({ mutationFn: authApi.resetPassword });
