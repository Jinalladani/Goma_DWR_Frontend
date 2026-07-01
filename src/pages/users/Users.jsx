import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Eye,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Users2,
  X,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";

import EmployeeReportCalendarModal from "../../components/EmployeeReportCalendarModal";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import MobileCard from "../../components/MobileCard";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";
import WorksheetReviewModal from "../../components/WorksheetReviewModal";

import {
  createUserApi,
  getUsersApi,
  updateUserApi,
  updateUserStatusApi,
} from "../../api/userApi";

import { getUser } from "../../utils/auth";

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  role: "EMPLOYEE",
  manager_id: "",
};

const PAGE_SIZE = 5;

export default function Users() {
  const navigate = useNavigate();

  const isSuperAdmin =
    getUser()?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");

  const [form, setForm] = useState(initialForm);

  const [editingUser, setEditingUser] =
    useState(null);

  const [calendarUser, setCalendarUser] =
    useState(null);

  const [calendarAnchor, setCalendarAnchor] =
    useState(null);

  const [selectedWorksheetId, setSelectedWorksheetId] =
    useState(null);

  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [totalItems, setTotalItems] =
    useState(0);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
      };

      if (roleFilter) {
        params.role = roleFilter;
      }

      const res = await getUsersApi(params);

      setUsers(res.users || []);

      setTotalItems(
        res.pagination?.total_items || 0
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadUsers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.full_name ||
      !form.email ||
      (!editingUser && !form.password)
    ) {
      toast.error(
        "Name, email and password are required"
      );

      return;
    }

    try {
      setLoading(true);

      if (editingUser) {
        const payload = {
          full_name: form.full_name,
          phone: form.phone,
        };

        if (isSuperAdmin) {
          payload.role = form.role;

          payload.manager_id = form.manager_id
            ? Number(form.manager_id)
            : null;
        }

        await updateUserApi(
          editingUser.id,
          payload
        );

        toast.success(
          "User updated successfully"
        );
      } else {
        await createUserApi({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role: form.role,
          manager_id: form.manager_id
            ? Number(form.manager_id)
            : null,
        });

        toast.success(
          "User created successfully"
        );
      }

      setForm(initialForm);

      setEditingUser(null);

      setShowForm(false);

      setCurrentPage(1);

      await loadUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "User save failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);

    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "EMPLOYEE",
      manager_id: user.manager_id || "",
    });

    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);

    setForm(initialForm);

    setShowForm(false);
  };

  const handleStatus = async (user) => {
    try {
      setLoading(true);

      await updateUserStatusApi(
        user.id,
        !user.is_active
      );

      toast.success(
        `User ${
          !user.is_active
            ? "activated"
            : "deactivated"
        } successfully`
      );

      await loadUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Status update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarClick = (e, user) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const modalHeight = 380;

    const modalWidth = 340;

    const spaceBelow =
      window.innerHeight - rect.bottom;

    const spaceAbove = rect.top;

    let topPosition;

    if (
      spaceBelow < modalHeight &&
      spaceAbove > modalHeight
    ) {
      topPosition = rect.top - modalHeight + 40;
    } else {
      topPosition = rect.bottom + 8;
    }

    let leftPosition =
      rect.left + rect.width / 2;

    if (
      leftPosition + modalWidth / 2 >
      window.innerWidth - 20
    ) {
      leftPosition =
        window.innerWidth - modalWidth / 2 - 20;
    }

    if (leftPosition - modalWidth / 2 < 20) {
      leftPosition = modalWidth / 2 + 20;
    }

    setCalendarAnchor({
      top: topPosition,
      left: leftPosition,
    });

    setCalendarUser(user);
  };

  const renderUserActions = (user) => (
    <>
      {user.role === "EMPLOYEE" && (
        <button
          type="button"
          aria-label="View reports"
          onClick={() =>
            navigate(`/users/${user.id}/reports`)
          }
          className="rounded-xl border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <Eye size={18} />
        </button>
      )}

      {(isSuperAdmin ||
        user.role === "EMPLOYEE") && (
        <>
          <button
            type="button"
            aria-label="Edit user"
            onClick={() => handleEdit(user)}
            className="rounded-xl border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50"
          >
            <Pencil size={18} />
          </button>

          <button
            type="button"
            aria-label="Open report calendar"
            onClick={(e) =>
              handleCalendarClick(e, user)
            }
            className="rounded-xl border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100"
          >
            <CalendarDays size={18} />
          </button>

          <button
            type="button"
            aria-label={
              user.is_active
                ? "Deactivate user"
                : "Activate user"
            }
            onClick={() => handleStatus(user)}
            className={`rounded-xl border p-2 transition ${
              user.is_active
                ? "border-green-200 text-green-600 hover:bg-green-50"
                : "border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {user.is_active ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
          </button>
        </>
      )}
    </>
  );

  return (
    <DashboardLayout title="USER MANAGEMENT">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Users2 size={28} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Users List
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Total Users : {totalItems}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isSuperAdmin && (
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="">
                    All Roles
                  </option>

                  <option value="ADMIN">
                    Admin / Manager
                  </option>

                  <option value="EMPLOYEE">
                    Employee
                  </option>
                </select>
              )}

              <button
                onClick={() => {
                  setShowForm(true);

                  setEditingUser(null);

                  setForm(initialForm);
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
              >
                <UserPlus size={18} />

                Add Employee
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-3 bg-slate-50/60 p-4 md:hidden">
            {loading ? (
              <Loader message="Loading users..." />
            ) : users.length === 0 ? (
              <EmptyState title="No users found." />
            ) : (
              users.map((user) => (
                <MobileCard key={user.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 font-bold text-blue-700">
                      {user.full_name?.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {user.full_name}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-600">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                    {renderUserActions(user)}
                  </div>
                </MobileCard>
              ))
            )}
          </div>

          {/* Table */}
          <div className="hidden md:block">
            <Table minWidth="min-w-[950px]">
              <thead>
                <tr className="border-b bg-slate-50 text-sm font-semibold text-slate-700">
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Manager</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b text-sm transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-5 font-bold text-slate-800">
                      {(currentPage - 1) *
                        PAGE_SIZE +
                        index +
                        1}
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 font-bold text-blue-700">
                          {user.full_name?.charAt(0)}
                        </div>

                        <h3 className="font-semibold text-slate-800">
                          {user.full_name}
                        </h3>
                      </div>
                    </td>

                    <td className="px-5 py-5 text-slate-600">
                      {user.email}
                    </td>

                    <td className="px-5 py-5 text-slate-600">
                      {user.phone || "-"}
                    </td>

                    <td className="px-5 py-5">
                      <Badge value={user.role} />
                    </td>

                    <td className="px-5 py-5 text-slate-600">
                      {user.manager_name || "-"}
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {user.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex justify-center gap-2">
                        {renderUserActions(user)}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingUser
                      ? "Update User"
                      : "Add Employee"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Fill user details below
                  </p>
                </div>
              </div>

              <button
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <Field label="Full Name *">
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </Field>

              <Field label="Email Address *">
                <input
                  type="email"
                  value={form.email}
                  disabled={!!editingUser}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                  placeholder="Enter email"
                />
              </Field>

              {!editingUser && (
                <Field label="Password *">
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password: e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </Field>
              )}

              <Field label="Phone Number">
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </Field>

              {isSuperAdmin && (
                <Field label="Role *">
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="EMPLOYEE">
                      Employee
                    </option>

                    <option value="ADMIN">
                      Admin / Manager
                    </option>
                  </select>
                </Field>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading
                    ? editingUser
                      ? "Updating..."
                      : "Creating..."
                    : editingUser
                    ? "Update User"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {calendarUser && (
        <EmployeeReportCalendarModal
          employee={calendarUser}
          anchor={calendarAnchor}
          onClose={() =>
            setCalendarUser(null)
          }
          onSelectReport={(worksheetId) => {
            setCalendarUser(null);

            setSelectedWorksheetId(
              worksheetId
            );
          }}
        />
      )}

      {selectedWorksheetId && (
        <WorksheetReviewModal
          open={true}
          worksheetId={selectedWorksheetId}
          onClose={() =>
            setSelectedWorksheetId(null)
          }
        />
      )}
    </DashboardLayout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function Badge({ value }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        value === "ADMIN"
          ? "bg-purple-50 text-purple-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {value}
    </span>
  );
}