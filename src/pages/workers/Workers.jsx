import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Hammer,
  Pencil,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  UserRound,
  X,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import MobileCard from "../../components/MobileCard";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";
import { getUsersApi } from "../../api/userApi";
import {
  createWorkerApi,
  getWorkersApi,
  updateWorkerApi,
  updateWorkerStatusApi,
} from "../../api/workerApi";
// import { WORKER_TYPES } from "../../constants/workerTypes";
import { getUser } from "../../utils/auth";

const PAGE_SIZE = 5;

const initialForm = {
  full_name: "",
  phone: "",
  // worker_type: "Labour",
  assigned_employee_id: "",
  is_active: true,
};

export default function Workers() {
  const currentUser = getUser();
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(currentUser?.role);

  const [workers, setWorkers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingWorker, setEditingWorker] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [workerTypeFilter, setWorkerTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const loadWorkers = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
      };

      // if (workerTypeFilter) params.worker_type = workerTypeFilter;
      if (statusFilter) params.is_active = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await getWorkersApi(params);
      setWorkers(res.workers || []);
      setTotalItems(res.pagination?.total_items || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load workers");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, workerTypeFilter]);

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const res = await getUsersApi({ role: "EMPLOYEE" });
      setEmployees(res.users || []);
    } catch {
      toast.error("Failed to load employees");
    }
  }, [isAdmin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadWorkers();
      loadEmployees();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadEmployees, loadWorkers]);

  const openCreate = () => {
    setEditingWorker(null);
    setForm({
      ...initialForm,
      assigned_employee_id: isAdmin ? "" : currentUser?.id || "",
    });
    setShowForm(true);
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setForm({
      full_name: worker.full_name || "",
      phone: worker.phone || "",
      // worker_type: worker.worker_type || "Labour",
      assigned_employee_id: worker.assigned_employee_id || "",
      is_active: worker.is_active,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingWorker(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.full_name.trim() /* || !form.worker_type */) {
      toast.error("Full name and worker type are required");
      return;
    }

    if (isAdmin && !form.assigned_employee_id) {
      toast.error("Please select assigned employee");
      return;
    }

    const payload = {
      full_name: form.full_name,
      phone: form.phone,
      // worker_type: form.worker_type,
      is_active: form.is_active,
    };

    if (isAdmin) {
      payload.assigned_employee_id = Number(form.assigned_employee_id);
    }

    try {
      setLoading(true);

      if (editingWorker) {
        await updateWorkerApi(editingWorker.id, payload);
        toast.success("Worker updated successfully");
      } else {
        await createWorkerApi(payload);
        toast.success("Worker created successfully");
      }

      handleCancel();
      setCurrentPage(1);
      await loadWorkers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Worker save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (worker) => {
    try {
      setLoading(true);
      await updateWorkerStatusApi(worker.id, !worker.is_active);
      toast.success(
        `Worker ${!worker.is_active ? "activated" : "deactivated"} successfully`
      );
      await loadWorkers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="WORKERS">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Hammer size={27} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Worker Management
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Total Workers : {totalItems}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500"
                placeholder="Search workers"
              />

              <select
                value={workerTypeFilter}
                onChange={(event) => {
                  setWorkerTypeFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Types</option>
                {/* {WORKER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))} */} 
              </select>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <button
                type="button"
                onClick={openCreate}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
              >
                <PlusCircle size={18} />
                Add Worker
              </button>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50/60 p-4 md:hidden">
            {loading ? (
              <Loader message="Loading workers..." />
            ) : workers.length === 0 ? (
              <EmptyState title="No workers found." />
            ) : (
              workers.map((worker) => (
                <MobileCard key={worker.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <UserRound size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {worker.full_name}
                      </p>
                      {/* <p className="mt-1 text-sm text-blue-700">
                        {worker.worker_type || "-"}
                      </p> */}
                    </div>
                    <StatusBadge active={worker.is_active} />
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <InfoLine label="Phone" value={worker.phone || "-"} />
                    <InfoLine
                      label="Employee"
                      value={worker.assigned_employee_name || "-"}
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <ActionButtons
                      worker={worker}
                      onEdit={handleEdit}
                      onStatus={handleStatus}
                    />
                  </div>
                </MobileCard>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <Table minWidth="min-w-[900px]">
              <thead>
                <tr className="border-b bg-slate-50 text-sm font-semibold text-slate-700">
                  <th className="px-5 py-4">Worker</th>
                  {/* <th className="px-5 py-4">Type</th> */}
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Assigned Employee</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="border-b text-sm hover:bg-slate-50">
                    <td className="px-5 py-5 font-semibold text-slate-800">
                      {worker.full_name}
                    </td>
                    {/* <td className="px-5 py-5 text-slate-600">
                      {worker.worker_type || "-"}
                    </td> */}
                    <td className="px-5 py-5 text-slate-600">
                      {worker.phone || "-"}
                    </td>
                    <td className="px-5 py-5 text-slate-600">
                      {worker.assigned_employee_name || "-"}
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge active={worker.is_active} />
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex justify-center gap-2">
                        <ActionButtons
                          worker={worker}
                          onEdit={handleEdit}
                          onStatus={handleStatus}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && workers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500">
                      <EmptyState title="No workers found." />
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500">
                      <Loader message="Loading workers..." />
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

      <Modal open={showForm} onClose={handleCancel} side>
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Hammer size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingWorker ? "Update Worker" : "Add Worker"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fill worker details below
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-5">
          <Field label="Full Name *">
            <input
              value={form.full_name}
              onChange={(event) =>
                setForm({ ...form, full_name: event.target.value })
              }
              className="input"
              placeholder="Enter worker name"
            />
          </Field>

          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="input"
              placeholder="Enter phone"
            />
          </Field>

          {/* <Field label="Worker Type *">
            <select
              value={form.worker_type}
              onChange={(event) =>
                setForm({ ...form, worker_type: event.target.value })
              }
              className="input"
            >
              {WORKER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field> */}

          {isAdmin && (
            <Field label="Assign Employee *">
              <select
                value={form.assigned_employee_id}
                onChange={(event) =>
                  setForm({ ...form, assigned_employee_id: event.target.value })
                }
                className="input"
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <div>
              <p className="font-semibold text-slate-800">Status</p>
              <p className="text-sm text-slate-500">
                Active workers show in timesheet
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={form.is_active ? "text-green-600" : "text-slate-400"}
            >
              {form.is_active ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
            </button>
          </div>

          <button
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <PlusCircle size={18} />
            {editingWorker ? "Update Worker" : "Create Worker"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

function ActionButtons({ worker, onEdit, onStatus }) {
  return (
    <>
      <button
        type="button"
        aria-label="Edit worker"
        onClick={() => onEdit(worker)}
        className="rounded-xl border border-blue-200 p-2 text-blue-600 hover:bg-blue-50"
      >
        <Pencil size={18} />
      </button>
      <button
        type="button"
        aria-label={worker.is_active ? "Deactivate worker" : "Activate worker"}
        onClick={() => onStatus(worker)}
        className={`rounded-xl border p-2 ${
          worker.is_active
            ? "border-green-200 text-green-600 hover:bg-green-50"
            : "border-slate-200 text-slate-500 hover:bg-slate-100"
        }`}
      >
        {worker.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
      </button>
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate font-medium text-slate-800">{value}</span>
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
