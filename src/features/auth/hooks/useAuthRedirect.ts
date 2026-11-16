import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { authPath, pendingReturnTo, rememberReturnTo } from "../utils/auth-redirect";

export const useAuthRedirect = () => {
  const { search } = useLocation();
  const returnTo = pendingReturnTo(search);
  useEffect(() => { rememberReturnTo(returnTo); }, [returnTo]);
  return { returnTo, authHref: (path: "/login" | "/register" | "/forgot-password") => authPath(path, returnTo) };
};
