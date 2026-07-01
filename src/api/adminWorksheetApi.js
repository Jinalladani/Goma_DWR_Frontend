import apiClient from "./apiClient";

export const getAdminWorksheetsApi = async (params = {}) => {
  const response = await apiClient.get("/admin/worksheets", {
    params,
  });

  return response.data;
};

export const getAdminWorksheetDetailApi = async (worksheetId) => {
  const response = await apiClient.get(`/admin/worksheets/${worksheetId}`);
  return response.data;
};

export const reviewWorksheetApi = async (worksheetId, payload) => {
  const response = await apiClient.patch(
    `/admin/worksheets/${worksheetId}/review`,
    payload
  );

  return response.data;
};