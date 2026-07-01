import apiClient from "./apiClient";

export const getWorkersApi = async (params = {}) => {
  const response = await apiClient.get("/workers", { params });
  return response.data;
};

export const createWorkerApi = async (payload) => {
  const response = await apiClient.post("/workers", payload);
  return response.data;
};

export const updateWorkerApi = async (workerId, payload) => {
  const response = await apiClient.put(`/workers/${workerId}`, payload);
  return response.data;
};

export const updateWorkerStatusApi = async (workerId, isActive) => {
  const response = await apiClient.patch(`/workers/${workerId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

export const deleteWorkerApi = async (workerId) => {
  const response = await apiClient.delete(`/workers/${workerId}`);
  return response.data;
};
