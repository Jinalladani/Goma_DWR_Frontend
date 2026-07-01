import apiClient from "./apiClient";

export const employeeDashboardApi = async () => {
  const response = await apiClient.get(
    "/dashboard/employee"
  );

  return response.data;
};

export const adminDashboardApi = async () => {
  const response = await apiClient.get(
    "/dashboard/admin"
  );

  return response.data;
};

export const superAdminDashboardApi = async () => {
  const response = await apiClient.get(
    "/dashboard/super-admin"
  );

  return response.data;
};