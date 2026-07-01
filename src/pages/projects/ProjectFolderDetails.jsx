import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Eye,
  FolderKanban,
  Pencil,
  Plus,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import MobileCard from "../../components/MobileCard";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";

import {
  createProjectApi,
  deleteProjectApi,
  getProjectsApi,
  updateProjectApi,
} from "../../api/projectApi";
import { getProjectFoldersApi } from "../../api/projectFolderApi";

const initialProjectForm = {
  folder_id: "",
  project_code: "",
  project_name: "",
  description: "",
  is_active: true,
};

const PAGE_SIZE = 8;

export default function ProjectFolderDetails() {
  const { folderId } = useParams();
  const navigate = useNavigate();

  const [folder, setFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState({
    ...initialProjectForm,
    folder_id: folderId || "",
  });
  const [editingProject, setEditingProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const activeFolders = useMemo(
    () => folders.filter((item) => item.is_active),
    [folders]
  );

  const loadFolderAndProjects = useCallback(async () => {
    try {
      setLoading(true);

      const [foldersRes, projectsRes] = await Promise.all([
        getProjectFoldersApi({ page: 1, limit: 500 }),
        getProjectsApi({ page: currentPage, limit: PAGE_SIZE, folder_id: folderId }),
      ]);

      const folderList = foldersRes.folders || [];
      setFolders(folderList);
      setFolder(folderList.find((item) => String(item.id) === String(folderId)) || null);
      setProjects(projectsRes.projects || []);
      setTotalItems(projectsRes.pagination?.total_items || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load folder projects");
    } finally {
      setLoading(false);
    }
  }, [currentPage, folderId]);

  useEffect(() => {
    loadFolderAndProjects();
  }, [loadFolderAndProjects]);

  const handleProjectSubmit = async (e) => {
    e.preventDefault();

    if (!projectForm.folder_id) {
      toast.error("Please select folder");
      return;
    }

    if (!projectForm.project_code.trim() || !projectForm.project_name.trim()) {
      toast.error("Project code and name are required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...projectForm,
        folder_id: Number(projectForm.folder_id),
      };

      if (editingProject) {
        await updateProjectApi(editingProject.id, payload);
        toast.success("Project updated successfully");
      } else {
        await createProjectApi(payload);
        toast.success("Project created successfully");
      }

      setProjectForm({ ...initialProjectForm, folder_id: folderId || "" });
      setEditingProject(null);
      setShowProjectForm(false);
      setCurrentPage(1);
      await loadFolderAndProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || "Project save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectEdit = (project) => {
    setEditingProject(project);
    setProjectForm({
      folder_id: project.folder_id ? String(project.folder_id) : folderId || "",
      project_code: project.project_code || "",
      project_name: project.project_name || "",
      description: project.description || "",
      is_active: project.is_active,
    });
    setShowProjectForm(true);
  };

  const handleCancelProjectEdit = () => {
    setEditingProject(null);
    setProjectForm({ ...initialProjectForm, folder_id: folderId || "" });
    setShowProjectForm(false);
  };

  const handleProjectToggleStatus = async (project) => {
    try {
      setLoading(true);

      await updateProjectApi(project.id, {
        folder_id: project.folder_id,
        project_code: project.project_code,
        project_name: project.project_name,
        description: project.description,
        is_active: !project.is_active,
      });

      toast.success(`Project ${!project.is_active ? "activated" : "deactivated"} successfully`);
      await loadFolderAndProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectDelete = async () => {
    if (!projectToDelete) return;

    try {
      setLoading(true);
      await deleteProjectApi(projectToDelete.id);
      toast.success("Project deleted successfully");
      setProjectToDelete(null);
      await loadFolderAndProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || "Project delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="FOLDER PROJECTS">
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate("/projects")}
                className="mt-1 rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FolderKanban size={26} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {folder?.folder_name || "Folder Projects"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {folder?.description || "All projects created inside this folder are listed here."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge active={folder?.is_active} />
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {totalItems} Projects
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingProject(null);
                setProjectForm({ ...initialProjectForm, folder_id: folderId || "" });
                setShowProjectForm(true);
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
            >
              <PlusCircle size={18} />
              Add Project
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b p-4 sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">Project List</h2>
            <p className="text-sm text-slate-500">
              Manage only this folder's projects from here.
            </p>
          </div>

          <div className="space-y-3 bg-slate-50/60 p-4 md:hidden">
            {loading ? (
              <Loader message="Loading projects..." />
            ) : projects.length === 0 ? (
              <EmptyState title="No projects found in this folder." />
            ) : (
              projects.map((project) => (
                <MobileCard key={project.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <BriefcaseBusiness size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{project.project_name}</p>
                      <p className="mt-1 text-sm font-medium text-blue-700">{project.project_code || "-"}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description || "No description"}</p>
                    </div>
                    <StatusBadge active={project.is_active} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Created: {formatDate(project.created_at)}</p>
                  <ProjectActions
                    project={project}
                    navigate={navigate}
                    onEdit={handleProjectEdit}
                    onToggle={handleProjectToggleStatus}
                    onDelete={setProjectToDelete}
                  />
                </MobileCard>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <thead>
                <tr className="border-b bg-slate-50 text-sm font-semibold text-slate-700">
                  <th className="px-5 py-4">Project Code</th>
                  <th className="px-5 py-4">Project Name</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created At</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b text-sm transition hover:bg-slate-50">
                    <td className="px-5 py-5 font-semibold text-slate-700">{project.project_code || "-"}</td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                          <BriefcaseBusiness size={18} />
                        </div>
                        <h3 className="font-semibold text-slate-800">{project.project_name}</h3>
                      </div>
                    </td>
                    <td className="max-w-md px-5 py-5 text-slate-600">
                      <span className="line-clamp-2">{project.description || "-"}</span>
                    </td>
                    <td className="px-5 py-5"><StatusBadge active={project.is_active} /></td>
                    <td className="px-5 py-5 text-slate-600">{formatDate(project.created_at)}</td>
                    <td className="px-5 py-5">
                      <ProjectActions
                        project={project}
                        navigate={navigate}
                        onEdit={handleProjectEdit}
                        onToggle={handleProjectToggleStatus}
                        onDelete={setProjectToDelete}
                      />
                    </td>
                  </tr>
                ))}

                {!loading && projects.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500">
                      <EmptyState title="No projects found in this folder." />
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500">
                      <Loader message="Loading projects..." />
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </section>
      </div>

      <Modal open={showProjectForm} onClose={handleCancelProjectEdit} side>
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BriefcaseBusiness size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingProject ? "Update Project" : "Add Project"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Project will be saved inside selected folder</p>
            </div>
          </div>
          <button onClick={handleCancelProjectEdit} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleProjectSubmit} className="space-y-5 p-4 sm:p-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Project Folder *</label>
            <select
              value={projectForm.folder_id}
              onChange={(e) => setProjectForm({ ...projectForm, folder_id: e.target.value })}
              className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-blue-500"
            >
              <option value="">Select Folder</option>
              {activeFolders.map((item) => (
                <option key={item.id} value={item.id}>{item.folder_name}</option>
              ))}
            </select>
          </div>
          <FormInput
            label="Project Code *"
            value={projectForm.project_code}
            onChange={(value) => setProjectForm({ ...projectForm, project_code: value })}
            placeholder="Enter project code"
          />
          <FormInput
            label="Project Name *"
            value={projectForm.project_name}
            onChange={(value) => setProjectForm({ ...projectForm, project_name: value })}
            placeholder="Enter project name"
          />
          <FormTextArea
            label="Description"
            value={projectForm.description}
            onChange={(value) => setProjectForm({ ...projectForm, description: value })}
            placeholder="Enter project description"
          />
          <StatusToggle
            title="Project Status"
            description="Active projects show in dropdown"
            active={projectForm.is_active}
            onClick={() => setProjectForm({ ...projectForm, is_active: !projectForm.is_active })}
          />
          <SubmitButton loading={loading} label={editingProject ? "Update Project" : "Create Project"} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!projectToDelete}
        title="Delete project?"
        message={`This will deactivate "${projectToDelete?.project_name || "this project"}".`}
        confirmLabel="Delete Project"
        onCancel={() => setProjectToDelete(null)}
        onConfirm={handleProjectDelete}
        loading={loading}
      />
    </DashboardLayout>
  );
}

function ProjectActions({ project, navigate, onEdit, onToggle, onDelete }) {
  return (
    <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 md:mt-0 md:justify-center md:border-t-0 md:pt-0">
      <button onClick={() => navigate(`/projects/${project.id}`)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" title="View report">
        <Eye size={18} />
      </button>
      <button onClick={() => onEdit(project)} className="rounded-xl border border-blue-200 p-2 text-blue-600 hover:bg-blue-50" title="Edit project">
        <Pencil size={18} />
      </button>
      <button
        onClick={() => onToggle(project)}
        className={`rounded-xl border p-2 ${
          project.is_active
            ? "border-green-200 text-green-600 hover:bg-green-50"
            : "border-slate-200 text-slate-500 hover:bg-slate-100"
        }`}
        title="Change status"
      >
        {project.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
      </button>
      <button onClick={() => onDelete(project)} className="rounded-xl border border-red-200 p-2 text-red-500 hover:bg-red-50" title="Delete project">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
}

function FormTextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <textarea
        rows="5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 p-4 outline-none transition focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
}

function StatusToggle({ title, description, active, onClick }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button type="button" onClick={onClick} className={active ? "text-green-600" : "text-slate-400"}>
        {active ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
      </button>
    </div>
  );
}

function SubmitButton({ loading, label }) {
  return (
    <button
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
    >
      <Plus size={18} />
      {label}
    </button>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const day = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month}, ${year}`;
}
