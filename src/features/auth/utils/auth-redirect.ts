const pendingKey = "mora.auth.returnTo";

export const safeReturnTo = (value: string | null | undefined): string | null => {
  if (!value || !value.startsWith("/") || value.startsWith("//") ||
      [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 92)) return null;
  try {
    const url = new URL(value, "https://mora.invalid");
    if (url.origin !== "https://mora.invalid") return null;
    const allowed = url.pathname === "/" || url.pathname === "/profile" ||
      /^\/space\/[1-9]\d*(?:\/settings)?$/.test(url.pathname) ||
      /^\/join\/[A-Za-z0-9-]+$/.test(url.pathname) ||
      /^\/admin\/users?$/.test(url.pathname);
    return allowed ? url.pathname + url.search + url.hash : null;
  } catch { return null; }
};

export const resolveReturnTo = (search: string, stored?: string | null) =>
  safeReturnTo(new URLSearchParams(search).get("redirect")) || safeReturnTo(stored);

export const pendingReturnTo = (search = window.location.search) =>
  resolveReturnTo(search, sessionStorage.getItem(pendingKey));

export const rememberReturnTo = (value: string | null) => {
  const target = safeReturnTo(value);
  if (target) sessionStorage.setItem(pendingKey, target);
};
export const clearReturnTo = () => sessionStorage.removeItem(pendingKey);

export const authPath = (path: "/login" | "/register" | "/forgot-password", target?: string | null, expired = false) => {
  const params = new URLSearchParams();
  const safe = safeReturnTo(target);
  if (safe) params.set("redirect", safe);
  if (expired) params.set("expired", "true");
  return path + (params.size ? "?" + params.toString() : "");
};
