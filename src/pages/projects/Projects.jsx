import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Eye,
  FolderKanban,
  Pencil,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";

import {
  createProjectFolderApi,
  deleteProjectFolderApi,
  getProjectFoldersApi,
  updateProjectFolderApi,
} from "../../api/projectFolderApi";

const initialFolderForm = {
  folder_name: "",
  description: "",
  is_active: true,
};

const PAGE_SIZE = 9;

export default function Projects() {
  const navigate = useNavigate();

  const [folders, setFolders] = useState([]);
  const [folderForm, setFolderForm] = useState(initialFolderForm);
  const [editingFolder, setEditingFolder] = useState(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const activeFolderCount = useMemo(
    () => folders.filter((folder) => folder.is_active).length,
    [folders]
  );

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProjectFoldersApi({
        page: currentPage,
        limit: PAGE_SIZE,
      });

      const sortedFolders = [...(res.folders || [])].sort((a, b) =>
        (a.folder_name || "").localeCompare(b.folder_name || "", undefined, {
          sensitivity: "base",
        })
      );

      setFolders(sortedFolders);
      setTotalItems(res.pagination?.total_items || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleFolderSubmit = async (e) => {
    e.preventDefault();

    if (!folderForm.folder_name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      setLoading(true);

      if (editingFolder) {
        await updateProjectFolderApi(editingFolder.id, folderForm);
        toast.success("Folder updated successfully");
      } else {
        await createProjectFolderApi(folderForm);
        toast.success("Folder created successfully");
      }

      setFolderForm(initialFolderForm);
      setEditingFolder(null);
      setShowFolderForm(false);
      setCurrentPage(1);
      await loadFolders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Folder save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFolderEdit = (folder) => {
    setEditingFolder(folder);
    setFolderForm({
      folder_name: folder.folder_name || "",
      description: folder.description || "",
      is_active: folder.is_active,
    });
    setShowFolderForm(true);
  };

  const handleCancelFolderEdit = () => {
    setEditingFolder(null);
    setFolderForm(initialFolderForm);
    setShowFolderForm(false);
  };

  const handleFolderToggleStatus = async (folder) => {
    try {
      setLoading(true);

      await updateProjectFolderApi(folder.id, {
        folder_name: folder.folder_name,
        description: folder.description,
        is_active: !folder.is_active,
      });

      toast.success(
        `Folder ${!folder.is_active ? "activated" : "deactivated"} successfully`
      );
      await loadFolders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Folder status update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFolderDelete = async () => {
    if (!folderToDelete) return;

    try {
      setLoading(true);
      await deleteProjectFolderApi(folderToDelete.id);
      toast.success("Folder deleted successfully");
      setFolderToDelete(null);
      await loadFolders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Folder delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="PROJECT FOLDERS">
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FolderKanban size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Project Folders</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create folder first. Click View to manage projects inside that folder.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowFolderForm(true);
                setEditingFolder(null);
                setFolderForm(initialFolderForm);
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700"
            >
              <PlusCircle size={18} />
              Add Folder
            </button>
          </div>

          {/* <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FolderStat label="Total Folders" value={totalItems} />
            <FolderStat label="Active Folders" value={activeFolderCount} />
            <FolderStat label="Current Page" value={currentPage} />
          </div> */}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b p-4 sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">Folder List</h2>
            <p className="mt-1 text-sm text-slate-500">
              Projects are shown on separate folder details page to avoid confusion.
            </p>
          </div>

          <div className="grid gap-4 bg-slate-50/60 p-4 md:hidden">
            {loading ? (
              <Loader message="Loading folders..." />
            ) : folders.length === 0 ? (
              <EmptyState title="No folders found." />
            ) : (
              folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onView={() => navigate(`/project-folders/${folder.id}`)}
                  onEdit={() => handleFolderEdit(folder)}
                  onToggle={() => handleFolderToggleStatus(folder)}
                  onDelete={() => setFolderToDelete(folder)}
                />
              ))
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <thead>
                <tr className="border-b bg-slate-50 text-sm font-semibold text-slate-700">
                  <th className="px-5 py-4">Folder Name</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Projects</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created At</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {folders.map((folder) => (
                  <tr key={folder.id} className="border-b text-sm transition hover:bg-slate-50">
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                          <FolderKanban size={18} />
                        </div>
                        <h3 className="font-semibold text-slate-800">{folder.folder_name}</h3>
                      </div>
                    </td>
                    <td className="max-w-md px-5 py-5 text-slate-600">
                      <span className="line-clamp-2">{folder.description || "-"}</span>
                    </td>
                    <td className="px-5 py-5 font-semibold text-slate-700">
                      {folder.active_project_count || 0} Active
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge active={folder.is_active} />
                    </td>
                    <td className="px-5 py-5 text-slate-600">{formatDate(folder.created_at)}</td>
                    <td className="px-5 py-5">
                      <FolderActions
                        onView={() => navigate(`/project-folders/${folder.id}`)}
                        onEdit={() => handleFolderEdit(folder)}
                        onToggle={() => handleFolderToggleStatus(folder)}
                        onDelete={() => setFolderToDelete(folder)}
                        active={folder.is_active}
                      />
                    </td>
                  </tr>
                ))}

                {!loading && folders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500">
                      <EmptyState title="No folders found." />
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500">
                      <Loader message="Loading folders..." />
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

      <Modal open={showFolderForm} onClose={handleCancelFolderEdit} side>
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FolderKanban size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingFolder ? "Update Folder" : "Add Folder"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Folder details below</p>
            </div>
          </div>
          <button
            onClick={handleCancelFolderEdit}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFolderSubmit} className="space-y-5 p-4 sm:p-5">
          <FormInput
            label="Folder Name *"
            value={folderForm.folder_name}
            onChange={(value) => setFolderForm({ ...folderForm, folder_name: value })}
            placeholder="Enter folder name"
          />
          <FormTextArea
            label="Description"
            value={folderForm.description}
            onChange={(value) => setFolderForm({ ...folderForm, description: value })}
            placeholder="Enter folder description"
          />
          <StatusToggle
            title="Folder Status"
            description="Active folders show while creating project"
            active={folderForm.is_active}
            onClick={() => setFolderForm({ ...folderForm, is_active: !folderForm.is_active })}
          />
          <SubmitButton loading={loading} label={editingFolder ? "Update Folder" : "Create Folder"} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!folderToDelete}
        title="Delete folder?"
        message={`This will deactivate "${folderToDelete?.folder_name || "this folder"}" if it has no active projects.`}
        confirmLabel="Delete Folder"
        onCancel={() => setFolderToDelete(null)}
        onConfirm={handleFolderDelete}
        loading={loading}
      />
    </DashboardLayout>
  );
}

function FolderCard({ folder, onView, onEdit, onToggle, onDelete }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <FolderKanban size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{folder.folder_name}</p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {folder.description || "No description"}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {folder.active_project_count || 0} Active Projects
            </p>
          </div>
        </div>
        <StatusBadge active={folder.is_active} />
      </div>

      <FolderActions
        onView={onView}
        onEdit={onEdit}
        onToggle={onToggle}
        onDelete={onDelete}
        active={folder.is_active}
      />
    </div>
  );
}

function FolderActions({ onView, onEdit, onToggle, onDelete, active }) {
  return (
    <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 md:mt-0 md:justify-center md:border-t-0 md:pt-0">
      <button onClick={onView} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" title="View projects">
        <Eye size={18} />
      </button>
      <button onClick={onEdit} className="rounded-xl border border-blue-200 p-2 text-blue-600 hover:bg-blue-50" title="Edit folder">
        <Pencil size={18} />
      </button>
      <button
        onClick={onToggle}
        className={`rounded-xl border p-2 ${
          active
            ? "border-green-200 text-green-600 hover:bg-green-50"
            : "border-slate-200 text-slate-500 hover:bg-slate-100"
        }`}
        title="Change status"
      >
        {active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
      </button>
      {/* <button onClick={onDelete} className="rounded-xl border border-red-200 p-2 text-red-500 hover:bg-red-50" title="Delete folder">
        <Trash2 size={18} />
      </button> */}
    </div>
  );
}

function FolderStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
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
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
    >
      <PlusCircle size={18} />
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
