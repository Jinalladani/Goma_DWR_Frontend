import apiClient from "./apiClient";

export const assignProjectApi = async (payload) => {
  const response = await apiClient.post(
    "/project-access/assign",
    payload
  );

  return response.data;
};

export const getEmployeeProjectsApi = async (employeeId, params = {}) => {
  const response = await apiClient.get(
    `/project-access/employee/${employeeId}`,
    { params }
  );

  return response.data;
};

export const updateProjectAccessStatusApi = async (accessId, isActive) => {
  const response = await apiClient.put(
    `/project-access/status/${accessId}`,
    { is_active: isActive }
  );

  return response.data;
};

export const removeProjectAccessApi = async (accessId) => {
  const response = await apiClient.delete(
    `/project-access/remove/${accessId}`
  );

  return response.data;
};
