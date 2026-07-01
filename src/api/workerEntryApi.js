import apiClient from "./apiClient";

export const getTodayWorkerEntriesApi = async () => {
  const response = await apiClient.get("/worker-entries/today");
  return response.data;
};

export const createWorkerEntryApi = async (payload) => {
  const response = await apiClient.post("/worker-entries", payload);
  return response.data;
};

export const updateWorkerEntryApi = async (entryId, payload) => {
  const response = await apiClient.put(`/worker-entries/${entryId}`, payload);
  return response.data;
};

export const deleteWorkerEntryApi = async (entryId) => {
  const response = await apiClient.delete(`/worker-entries/${entryId}`);
  return response.data;
};
