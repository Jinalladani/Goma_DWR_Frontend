import apiClient from "./apiClient";

export const submitWorksheetApi = async (payload) => {
  const response = await apiClient.post("/worksheets/submit", payload);
  return response.data;
};

export const getMyWorksheetsApi = async (params = {}) => {
  const response = await apiClient.get("/worksheets/my", { params });
  return response.data;
};

export const getWorksheetDetailApi = async (worksheetId, params = {}) => {
  const response = await apiClient.get(`/worksheets/${worksheetId}`, { params });
  return response.data;
};
