export const getToken = () => {
  return localStorage.getItem("goma_token");
};

export const getRefreshToken = () => {
  return localStorage.getItem("goma_refresh_token");
};

export const getUser = () => {
  const user = localStorage.getItem("goma_user");

  return user ? JSON.parse(user) : null;
};

export const saveAuth = (token, user, refreshToken) => {
  localStorage.setItem("goma_token", token);

  if (refreshToken) {
    localStorage.setItem("goma_refresh_token", refreshToken);
  }

  localStorage.setItem(
    "goma_user",
    JSON.stringify(user)
  );
};

export const clearAuth = () => {
  localStorage.removeItem("goma_token");
  localStorage.removeItem("goma_refresh_token");

  localStorage.removeItem("goma_user");
};

export const saveAccessToken = (token) => {
  localStorage.setItem("goma_token", token);
};

export const isAuthenticated = () => {
  const token = getToken();

  if (!token) return false;

  if (isTokenExpired(token)) {
    const refreshToken = getRefreshToken();

    if (refreshToken && !isTokenExpired(refreshToken)) {
      return true;
    }

    clearAuth();
    return false;
  }

  return true;
};

export const getDashboardPath = (user = getUser()) => {
  if (user?.role === "SUPER_ADMIN") return "/super-admin/dashboard";
  if (user?.role === "ADMIN") return "/admin/dashboard";
  return "/employee/dashboard";
};

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload.exp) return false;

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};
