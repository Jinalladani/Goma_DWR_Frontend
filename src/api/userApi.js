import apiClient from "./apiClient";

export const getUsersApi = async (params = {}) => {
  const response = await apiClient.get("/users", { params });
  return response.data;
};

export const getUserReportsApi = async (userId, params = {}) => {
  const response = await apiClient.get(`/users/${userId}/reports`, { params });
  return response.data;
};

export const getUserReportCalendarApi = async (userId, params = {}) => {
  const response = await apiClient.get(`/users/${userId}/report-calendar`, {
    params,
  });
  return response.data;
};

export const createUserApi = async (payload) => {
  const response = await apiClient.post("/users", payload);
  return response.data;
};

export const updateUserApi = async (userId, payload) => {
  const response = await apiClient.put(`/users/${userId}`, payload);
  return response.data;
};

export const updateUserStatusApi = async (userId, isActive) => {
  const response = await apiClient.patch(`/users/${userId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

export const resetUserPasswordApi = async (userId, password) => {
  const response = await apiClient.patch(`/users/${userId}/reset-password`, {
    password,
  });
  return response.data;
};
