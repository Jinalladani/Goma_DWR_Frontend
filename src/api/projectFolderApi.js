import apiClient from "./apiClient";

export const getProjectFoldersApi = async (params = {}) => {
  const response = await apiClient.get("/project-folders", { params });
  return response.data;
};

export const getActiveProjectFoldersApi = async (params = {}) => {
  const response = await apiClient.get("/project-folders/active", { params });
  return response.data;
};

export const createProjectFolderApi = async (payload) => {
  const response = await apiClient.post("/project-folders", payload);
  return response.data;
};

export const updateProjectFolderApi = async (folderId, payload) => {
  const response = await apiClient.put(`/project-folders/${folderId}`, payload);
  return response.data;
};

export const deleteProjectFolderApi = async (folderId) => {
  const response = await apiClient.delete(`/project-folders/${folderId}`);
  return response.data;
};
