export function getUserRoleFromToken(): string | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || payload.userRole || payload.authorities?.[0] || null;
  } catch {
    return null;
  }
}