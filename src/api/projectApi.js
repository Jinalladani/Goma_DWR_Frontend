import apiClient from "./apiClient";

export const getProjectsApi = async (params = {}) => {
  const response = await apiClient.get("/projects", { params });
  return response.data;
};

export const getActiveProjectsApi = async (params = {}) => {
  const response = await apiClient.get("/projects/active", { params });
  return response.data;
};

export const getMyProjectsApi = async (params = {}) => {
  const response = await apiClient.get("/project-access/my-projects", { params });
  return response.data;
};

export const getProjectReportApi = async (projectId, params = {}) => {
  const response = await apiClient.get(`/projects/${projectId}/report`, { params });
  return response.data;
};

export const getProjectEmployeeReportApi = async (projectId, employeeId) => {
  const response = await apiClient.get(
    `/projects/${projectId}/report/employee/${employeeId}`
  );
  return response.data;
};

export const createProjectApi = async (payload) => {
  const response = await apiClient.post("/projects", payload);
  return response.data;
};

export const updateProjectApi = async (projectId, payload) => {
  const response = await apiClient.put(`/projects/${projectId}`, payload);
  return response.data;
};

export const deleteProjectApi = async (projectId) => {
  const response = await apiClient.delete(`/projects/${projectId}`);
  return response.data;
};
