import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  FolderKanban,
  Link2,
  ToggleLeft,
  ToggleRight,
  UserCog,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import MobileCard from "../../components/MobileCard";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";

import { getUsersApi } from "../../api/userApi";

import { getProjectsApi } from "../../api/projectApi";
import { getActiveProjectFoldersApi } from "../../api/projectFolderApi";

import {
  assignProjectApi,
  getEmployeeProjectsApi,
  updateProjectAccessStatusApi,
} from "../../api/projectAccessApi";

const PAGE_SIZE = 5;

export default function ProjectAccess() {

  const [employees, setEmployees] = useState([]);

  const [folders, setFolders] = useState([]);

  const [projects, setProjects] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [selectedFolder, setSelectedFolder] = useState("");

  const [selectedProject, setSelectedProject] = useState("");

  const [assignedProjects, setAssignedProjects] = useState([]);

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const filteredProjects = projects.filter((project) => (
    selectedFolder ? String(project.folder_id) === String(selectedFolder) : true
  ));


  const loadInitialData = useCallback(async () => {

    try {

      setLoading(true);

      const [usersRes, foldersRes, projectsRes] = await Promise.all([
        getUsersApi({
          role: "EMPLOYEE",
        }),

        getActiveProjectFoldersApi({ page: 1, limit: 200 }),

        getProjectsApi({ page: 1, limit: 500 }),
      ]);

      setEmployees(usersRes.users || []);

      setFolders(foldersRes.folders || []);

      setProjects(
        (projectsRes.projects || []).filter(
          (project) => project.is_active
        )
      );

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        "Failed to load data"
      );

    } finally {

      setLoading(false);
    }
  }, []);


  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadInitialData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadInitialData]);


  const loadEmployeeProjects = useCallback(async (
    employeeId,
    page = currentPage
  ) => {

    if (!employeeId) {
      setAssignedProjects([]);
      setTotalItems(0);
      return;
    }

    try {

      setLoading(true);

      const res =
        await getEmployeeProjectsApi(
          employeeId,
          { page, limit: PAGE_SIZE }
        );

      setAssignedProjects(
        res.projects || []
      );
      setTotalItems(res.pagination?.total_items || 0);

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        "Failed to load assigned projects"
      );

    } finally {

      setLoading(false);
    }
  }, [currentPage]);


  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEmployeeProjects(selectedEmployee);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadEmployeeProjects, selectedEmployee]);


  const handleEmployeeChange = async (
    employeeId
  ) => {

    setSelectedEmployee(employeeId);
    setCurrentPage(1);
  };


  const handleAssign = async () => {

    if (
      !selectedEmployee ||
      !selectedFolder ||
      !selectedProject
    ) {
      toast.error(
        "Please select employee, folder and project"
      );
      return;
    }

    try {

      setLoading(true);

      await assignProjectApi({
        employee_id: Number(
          selectedEmployee
        ),

        project_id: Number(
          selectedProject
        ),
      });

      toast.success(
        "Project assigned successfully"
      );

      setSelectedFolder("");
      setSelectedProject("");

      await loadEmployeeProjects(
        selectedEmployee,
        1
      );
      setCurrentPage(1);

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        "Project assign failed"
      );

    } finally {

      setLoading(false);
    }
  };


  const handleToggleStatus = async (access) => {
    try {

      setLoading(true);

      await updateProjectAccessStatusApi(
        access.id,
        !access.is_active
      );

      toast.success(
        `Project access ${
          !access.is_active
            ? "activated"
            : "deactivated"
        } successfully`
      );

      await loadEmployeeProjects(
        selectedEmployee
      );

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        "Failed to update access status"
      );

    } finally {

      setLoading(false);
    }
  };


  return (
    <DashboardLayout title="PROJECT ACCESS">

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[420px_1fr]">

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

          <PageHeader
            title="Assign Project"
            description="Give employee access to projects"
            icon={<Link2 />}
            className="mb-6"
          />


          <div className="space-y-5">

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Employee *
              </label>

              <select
                value={selectedEmployee}
                onChange={(e) =>
                  handleEmployeeChange(
                    e.target.value
                  )
                }
                className="input"
              >

                <option value="">
                  Select Employee
                </option>

                {employees.map((employee) => (

                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.full_name}
                  </option>

                ))}

              </select>

            </div>


            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Folder *
              </label>

              <select
                value={selectedFolder}
                onChange={(e) => {
                  setSelectedFolder(e.target.value);
                  setSelectedProject("");
                }}
                className="input"
              >

                <option value="">
                  Select Folder
                </option>

                {folders.map((folder) => (

                  <option
                    key={folder.id}
                    value={folder.id}
                  >
                    {folder.folder_name}
                  </option>

                ))}

              </select>

            </div>


            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Project *
              </label>

              <select
                value={selectedProject}
                disabled={!selectedFolder}
                onChange={(e) =>
                  setSelectedProject(
                    e.target.value
                  )
                }
                className="input disabled:bg-slate-100"
              >

                <option value="">
                  Select Project
                </option>

                {filteredProjects.map((project) => (

                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.project_name}
                  </option>

                ))}

              </select>

            </div>


            <button
              onClick={handleAssign}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >

              <Link2 size={18} />

              Assign Project

            </button>

          </div>

        </section>


        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

          <PageHeader
            title="Assigned Projects"
            description={`Total Assigned Projects: ${totalItems}`}
            icon={<FolderKanban />}
            className="mb-6"
            iconClassName="bg-green-50 text-green-600"
          />


          {!selectedEmployee ? (

            <EmptyState
              title="Select Employee"
              description="Choose employee to view assigned projects"
              icon={<UserCog size={56} />}
              className="h-[220px] rounded-2xl border border-dashed border-slate-300 py-0 sm:h-[300px]"
            />

          ) : (

            <div>
              <div className="space-y-3 md:hidden">
                {loading ? (
                  <Loader message="Loading projects..." />
                ) : assignedProjects.length === 0 ? (
                  <EmptyState title="No assigned projects found." />
                ) : (
                  assignedProjects.map((item, index) => (
                    <MobileCard key={item.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.project_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.employee_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Folder: {item.folder_name || "-"}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            #{(currentPage - 1) * PAGE_SIZE + index + 1}
                          </span>
                          <StatusBadge active={item.is_active} />
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-slate-600">
                        Assigned: {formatDate(item.created_at)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${
                          item.is_active
                            ? "border-green-200 text-green-600 hover:bg-green-50"
                            : "border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {item.is_active ? (
                          <ToggleRight size={19} />
                        ) : (
                          <ToggleLeft size={19} />
                        )}
                        {item.is_active ? "Active" : "Inactive"}
                      </button>
                    </MobileCard>
                  ))
                )}
              </div>

              <div className="hidden md:block">
                <Table minWidth="min-w-[700px]">

                <thead>

                  <tr className="border-y bg-slate-50 text-sm text-slate-700">

                    <th className="px-4 py-4">
                      #
                    </th>

                    <th className="px-4 py-4">
                      Employee
                    </th>

                    <th className="px-4 py-4">
                      Folder
                    </th>

                    <th className="px-4 py-4">
                      Project
                    </th>

                    <th className="px-4 py-4">
                      Assigned Date
                    </th>

                    <th className="px-4 py-4">
                      Status
                    </th>

                    <th className="px-4 py-4 text-center">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {assignedProjects.map(
                    (
                      item,
                      index
                    ) => (

                      <tr
                        key={item.id}
                        className="border-b text-sm"
                      >

                        <td className="px-4 py-5 font-bold">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </td>

                        <td className="px-4 py-5 font-semibold">
                          {
                            item.employee_name
                          }
                        </td>

                        <td className="px-4 py-5">
                          {
                            item.folder_name || "-"
                          }
                        </td>

                        <td className="px-4 py-5">
                          {
                            item.project_name
                          }
                        </td>

                        <td className="px-4 py-5">
                          {formatDate(
                            item.created_at
                          )}
                        </td>

                        <td className="px-4 py-5">
                          <StatusBadge active={item.is_active} />
                        </td>

                        <td className="px-4 py-5">

                          <div className="flex justify-center">

                            <button
                              type="button"
                              aria-label={
                                item.is_active
                                  ? "Deactivate project access"
                                  : "Activate project access"
                              }
                              onClick={() => handleToggleStatus(item)}
                              className={`rounded-lg border p-2 ${
                                item.is_active
                                  ? "border-green-200 text-green-600 hover:bg-green-50"
                                  : "border-slate-200 text-slate-500 hover:bg-slate-100"
                              }`}
                            >

                              {item.is_active ? (
                                <ToggleRight size={20} />
                              ) : (
                                <ToggleLeft size={20} />
                              )}

                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}


                  {!loading &&
                    assignedProjects.length ===
                      0 && (

                      <tr>

                        <td
                          colSpan="7"
                          className="py-12 text-center text-slate-500"
                        >
                          <EmptyState title="No assigned projects found." />
                        </td>

                      </tr>

                    )}


                  {loading && (

                    <tr>

                      <td
                        colSpan="7"
                        className="py-12 text-center text-slate-500"
                      >
                        <Loader message="Loading projects..." />
                      </td>

                    </tr>

                  )}

                </tbody>

                </Table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />

            </div>

          )}

        </section>

      </div>

    </DashboardLayout>
  );
}


function StatusBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}


function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  const day = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month},${year}`;
}
