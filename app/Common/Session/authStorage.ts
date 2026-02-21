const KEY = "rememberMe";

export function getRememberMe(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "true";
}

export function setRememberMe(v: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, v ? "true" : "false");
}