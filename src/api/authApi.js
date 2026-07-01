import apiClient from "./apiClient";

export const loginApi = async (payload) => {
  const response = await apiClient.post(
    "/auth/login",
    payload
  );

  return response.data;
};

export const profileApi = async () => {
  const response = await apiClient.get(
    "/auth/profile"
  );

  return response.data;
};

export const logoutApi = async (refreshToken) => {
  const response = await apiClient.post(
    "/auth/logout",
    { refresh_token: refreshToken }
  );

  return response.data;
};

export const updateProfileApi = async (payload) => {
  const response = await apiClient.put(
    "/auth/profile/update",
    payload
  );
  return response.data;
};

export const changePasswordApi = async (payload) => {
  const response = await apiClient.post(
    "/auth/change-password",
    payload
  );
  return response.data;
};

export const forgotPasswordApi = async (payload) => {
  const response = await apiClient.post(
    "/auth/forgot-password/reset",
    payload
  );
  return response.data;
};

export const requestPasswordResetApi = async (payload) => {
  const response = await apiClient.post(
    "/auth/forgot-password/request",
    payload
  );
  return response.data;
};
