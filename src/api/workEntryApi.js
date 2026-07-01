import apiClient from "./apiClient";

export const getTodayEntriesApi = async () => {
  const response = await apiClient.get("/work-entries/today");
  return response.data;
};

export const startWorkApi = async (payload) => {
  const response = await apiClient.post("/work-entries/start", payload);
  return response.data;
};

export const stopWorkApi = async (entryId) => {
  const response = await apiClient.patch(`/work-entries/stop/${entryId}`);
  return response.data;
};

export const updateEntryDescriptionApi = async (entryId, description) => {
  const response = await apiClient.patch(
    `/work-entries/${entryId}/description`,
    { description }
  );
  return response.data;
};

export const updateWorkEntryApi = async (entryId, payload) => {
  const response = await apiClient.put(`/work-entries/${entryId}`, payload);
  return response.data;
};

export const deleteWorkEntryApi = async (entryId) => {
  const response = await apiClient.delete(`/work-entries/${entryId}`);
  return response.data;
};