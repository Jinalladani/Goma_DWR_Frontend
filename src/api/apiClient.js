import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
let refreshRequest = null;

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("goma_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("goma_refresh_token");
    const canRefresh =
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest?._retried &&
      originalRequest?.url !== "/auth/login" &&
      originalRequest?.url !== "/auth/refresh";

    if (canRefresh) {
      originalRequest._retried = true;

      try {
        refreshRequest ??= refreshClient
          .post("/auth/refresh", null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          })
          .finally(() => {
            refreshRequest = null;
          });

        const response = await refreshRequest;
        const accessToken = response.data.access_token || response.data.token;
        localStorage.setItem("goma_token", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
      } catch {
        // Fall through to clear the expired session.
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("goma_token");
      localStorage.removeItem("goma_refresh_token");
      localStorage.removeItem("goma_user");

      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
