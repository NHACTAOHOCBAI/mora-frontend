type Session = { token: string | null; revision: number; expired: boolean; explicitLogout: boolean };
let session: Session = { token: localStorage.getItem("token"), revision: 0, expired: false, explicitLogout: false };
const listeners = new Set<() => void>();
const resets = new Set<() => void>();

const apply = (token: string | null, expired: boolean, persist: boolean, explicitLogout = false) => {
  if (persist) {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }
  session = { token, revision: session.revision + 1, expired, explicitLogout };
  resets.forEach(reset => reset());
  listeners.forEach(listener => listener());
};
export const getSession = () => session;
export const subscribeSession = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const onSessionReset = (listener: () => void) => {
  resets.add(listener);
  return () => { resets.delete(listener); };
};
export const setSessionToken = (token: string | null, explicitLogout = false) => apply(token, false, true, explicitLogout);
export const expireSession = (requestToken: string) => {
  if (!session.token || requestToken !== session.token || localStorage.getItem("token") !== requestToken) return false;
  localStorage.removeItem("originalToken");
  apply(null, true, true);
  return true;
};
window.addEventListener("storage", event => {
  if ((event.key === "token" || event.key === null) && localStorage.getItem("token") !== session.token) {
    apply(localStorage.getItem("token"), false, false);
  }
});
