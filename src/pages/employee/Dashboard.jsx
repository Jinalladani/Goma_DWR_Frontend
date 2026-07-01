import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Hammer,
  Play,
  Save,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import MobileCard from "../../components/MobileCard";
import Table from "../../components/Table";
import { getMyProjectsApi } from "../../api/projectApi";
import { getActiveProjectFoldersApi } from "../../api/projectFolderApi";
import { getWorkersApi } from "../../api/workerApi";
import {
  createWorkerEntryApi,
  deleteWorkerEntryApi,
  getTodayWorkerEntriesApi,
  updateWorkerEntryApi,
} from "../../api/workerEntryApi";
import {
  deleteWorkEntryApi,
  getTodayEntriesApi,
  startWorkApi,
  stopWorkApi,
  updateEntryDescriptionApi,
  updateWorkEntryApi,
} from "../../api/workEntryApi";
import { submitWorksheetApi } from "../../api/worksheetApi";
// import { WORKER_TYPES } from "../../constants/workerTypes";

const workerEntryInitialForm = {
  worker_id: "",
  project_id: "",
  work_type: "Labour",
  task_title: "",
  work_date: todayInputDate(),
  start_time: "",
  end_time: "",
  description: "",
};

export default function EmployeeDashboard() {
  const [folders, setFolders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [workerEntries, setWorkerEntries] = useState([]);
  const [worksheet, setWorksheet] = useState(null);

  const [folderId, setFolderId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [workerFolderId, setWorkerFolderId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [note, setNote] = useState("");
  const [descriptions, setDescriptions] = useState({});
  const [savedDescriptions, setSavedDescriptions] = useState({});

  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [workerEntryToDelete, setWorkerEntryToDelete] = useState(null);
  const [workerEntryForm, setWorkerEntryForm] = useState(workerEntryInitialForm);
  const [editingWorkerEntry, setEditingWorkerEntry] = useState(null);
  const [workerTimesheetOpen, setWorkerTimesheetOpen] = useState(false);

  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editValues, setEditValues] = useState({
    task_title: "",
    start_time: "",
    stop_time: "",
    description: "",
  });

  const filteredProjects = projects.filter((project) => (
    folderId ? String(project.folder_id) === String(folderId) : true
  ));
  const filteredWorkerProjects = projects.filter((project) => (
    workerFolderId ? String(project.folder_id) === String(workerFolderId) : true
  ));

  const runningEntry = entries.find((entry) => entry.status === "RUNNING");
  const completedEntries = entries.filter((entry) => entry.status !== "RUNNING");
  const isSubmitted = worksheet?.status === "SUBMITTED";
  const workerTotalMinutes = workerEntries.reduce(
    (total, entry) => total + (entry.total_minutes || 0),
    0
  );
  const ownTotalMinutes = completedEntries.reduce(
    (total, entry) => total + (entry.total_minutes || 0),
    0
  );
  const workerFormError = getWorkerFormError(
    workerEntryForm,
    workerEntries,
    editingWorkerEntry?.id
  );
  const workerFormComplete = isWorkerFormComplete(workerEntryForm);
  const workerTimeRangeValid = isTimeRangeValid(
    workerEntryForm.start_time,
    workerEntryForm.end_time
  );

  const loadData = useCallback(async () => {
    try {
      const [foldersRes, projectsRes, entriesRes, workersRes, workerEntriesRes] = await Promise.all([
        getActiveProjectFoldersApi({ page: 1, limit: 200 }),
        getMyProjectsApi({ page: 1, limit: 500 }),
        getTodayEntriesApi(),
        getWorkersApi({ is_active: true }),
        getTodayWorkerEntriesApi(),
      ]);

      const apiEntries = entriesRes.entries || [];

      setFolders(foldersRes.folders || []);
      setProjects(projectsRes.projects || []);
      setWorkers(workersRes.workers || []);
      setWorksheet(entriesRes.worksheet);
      setEntries(apiEntries);
      setWorkerEntries(workerEntriesRes.entries || []);

      const descMap = {};
      apiEntries.forEach((entry) => {
        descMap[entry.id] = entry.description || "";
      });

      setDescriptions(descMap);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load data");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (runningEntry) {
        const runningProject = projects.find((project) => (
          String(project.project_id) === String(runningEntry.project_id) ||
          String(project.id) === String(runningEntry.project_id)
        ));
        setFolderId(runningProject?.folder_id ? String(runningProject.folder_id) : "");
        setProjectId(String(runningEntry.project_id));
        setTaskTitle(runningEntry.task_title);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [runningEntry, projects]);

  const handleStart = async () => {
    if (!folderId || !projectId || !taskTitle.trim()) {
      toast.error("Please select folder, project and enter task title");
      return;
    }

    try {
      setLoading(true);

      await startWorkApi({
        project_id: Number(projectId),
        task_title: taskTitle,
      });

      toast.success("Work started successfully");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Start work failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!runningEntry) return;

    try {
      setLoading(true);

      await stopWorkApi(runningEntry.id);

      setFolderId("");
      setProjectId("");
      setTaskTitle("");

      toast.success("Work stopped successfully");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Stop work failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDescriptionSave = async (entryId) => {
    if (!descriptions[entryId]?.trim()) {
      toast.error("Description is required");
      return;
    }

    try {
      setLoading(true);

      await updateEntryDescriptionApi(entryId, descriptions[entryId] || "");

      setSavedDescriptions((prev) => ({
        ...prev,
        [entryId]: true,
      }));

      toast.success("Description saved");
      await loadData();

      setTimeout(() => {
        setSavedDescriptions((prev) => ({
          ...prev,
          [entryId]: false,
        }));
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Description update failed");
    } finally {
      setLoading(false);
    }
  };

  const getHHMM = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const hrs = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${hrs}:${mins}`;
  };

  const calculateMinutesDiff = (startStr, stopStr) => {
    if (!startStr || !stopStr) return 0;
    const [startH, startM] = startStr.split(":").map(Number);
    const [stopH, stopM] = stopStr.split(":").map(Number);
    const startTotal = startH * 60 + startM;
    const stopTotal = stopH * 60 + stopM;
    return Math.max(0, stopTotal - startTotal);
  };

  const handleEditClick = (item) => {
    setEditingEntryId(item.id);
    setEditValues({
      task_title: item.task_title || "",
      start_time: getHHMM(item.start_time),
      stop_time: getHHMM(item.stop_time),
      description: descriptions[item.id] || item.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditValues({
      task_title: "",
      start_time: "",
      stop_time: "",
      description: "",
    });
  };

  const handleFullSave = async (entryId) => {
    if (!editValues.task_title.trim()) {
      toast.error("Task Title cannot be empty");
      return;
    }
    if (!editValues.start_time || !editValues.stop_time) {
      toast.error("Start Time and Stop Time are required");
      return;
    }
    if (!editValues.description.trim()) {
      toast.error("Description is required");
      return;
    }

    const currentEntry = completedEntries.find((entry) => entry.id === entryId);
    const workDate = getDateInputValue(currentEntry?.start_time);

    if (
      isFutureTime(workDate, editValues.start_time) ||
      isFutureTime(workDate, editValues.stop_time)
    ) {
      toast.error("Future time is not allowed.");
      return;
    }

    if (!isTimeRangeValid(editValues.start_time, editValues.stop_time)) {
      toast.error("End time must be greater than start time.");
      return;
    }

    if (
      hasTimeOverlap({
        entries: completedEntries,
        start: editValues.start_time,
        end: editValues.stop_time,
        currentId: entryId,
        date: workDate,
        dateKey: "start_time",
        startKey: "start_time",
        endKey: "stop_time",
      })
    ) {
      toast.error("You already have a work entry in this time range.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        task_title: editValues.task_title,
        start_time: editValues.start_time,
        stop_time: editValues.stop_time,
        description: editValues.description,
      };

      await updateWorkEntryApi(entryId, payload);

      setDescriptions((prev) => ({
        ...prev,
        [entryId]: editValues.description,
      }));

      toast.success("Work entry updated successfully");
      setEditingEntryId(null);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update work entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    try {
      setLoading(true);

      await deleteWorkEntryApi(entryToDelete.id);

      toast.success("Entry deleted successfully");
      setEntryToDelete(null);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Entry delete failed");
    } finally {
      setLoading(false);
    }
  };

  const validateWorkerEntry = () => {
    if (
      !workerEntryForm.worker_id ||
      !workerFolderId ||
      !workerEntryForm.project_id ||
      !workerEntryForm.work_type ||
      !workerEntryForm.task_title.trim() ||
      !workerEntryForm.description.trim() ||
      !workerEntryForm.work_date ||
      !workerEntryForm.start_time ||
      !workerEntryForm.end_time
    ) {
      toast.error("Worker, folder, project, work type, task, description, date and time are required");
      return false;
    }

    if (isFutureDate(workerEntryForm.work_date)) {
      toast.error("Future date is not allowed.");
      return false;
    }

    if (
      isFutureTime(workerEntryForm.work_date, workerEntryForm.start_time) ||
      isFutureTime(workerEntryForm.work_date, workerEntryForm.end_time)
    ) {
      toast.error("Future time is not allowed.");
      return false;
    }

    if (!isTimeRangeValid(workerEntryForm.start_time, workerEntryForm.end_time)) {
      toast.error("End time must be greater than start time.");
      return false;
    }

    if (
      hasTimeOverlap({
        entries: workerEntries,
        start: workerEntryForm.start_time,
        end: workerEntryForm.end_time,
        currentId: editingWorkerEntry?.id,
        date: workerEntryForm.work_date,
        dateKey: "work_date",
        startKey: "start_time",
        endKey: "end_time",
        ownerKey: "worker_id",
        ownerId: Number(workerEntryForm.worker_id),
      })
    ) {
      toast.error("This worker already has an entry in this time range.");
      return false;
    }

    return true;
  };

  const handleWorkerEntrySave = async () => {
    if (!validateWorkerEntry()) return;

    const payload = {
      worker_id: Number(workerEntryForm.worker_id),
      project_id: Number(workerEntryForm.project_id),
      work_date: workerEntryForm.work_date,
      work_type: workerEntryForm.work_type,
      task_title: workerEntryForm.task_title,
      description: workerEntryForm.description,
      start_time: workerEntryForm.start_time,
      end_time: workerEntryForm.end_time,
    };

    try {
      setLoading(true);

      if (editingWorkerEntry) {
        await updateWorkerEntryApi(editingWorkerEntry.id, payload);
        toast.success("Worker entry updated successfully");
      } else {
        await createWorkerEntryApi(payload);
        toast.success("Worker entry saved successfully");
      }

      setEditingWorkerEntry(null);
      setWorkerEntryForm({
        ...workerEntryInitialForm,
        work_date: todayInputDate(),
      });
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Worker entry save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerEntryEdit = (entry) => {
    setEditingWorkerEntry(entry);
    setWorkerTimesheetOpen(true);
    const selectedProject = projects.find((project) => (
      String(project.project_id) === String(entry.project_id) ||
      String(project.id) === String(entry.project_id)
    ));

    setWorkerFolderId(selectedProject?.folder_id ? String(selectedProject.folder_id) : "");
    setWorkerEntryForm({
      worker_id: String(entry.worker_id || ""),
      project_id: String(entry.project_id || ""),
      work_type: entry.work_type || "Labour",
      task_title: entry.task_title || "",
      work_date: entry.work_date || todayInputDate(),
      start_time: getHHMM(entry.start_time),
      end_time: getHHMM(entry.end_time),
      description: entry.description || "",
    });
  };

  const handleWorkerEntryCancel = () => {
    setEditingWorkerEntry(null);
    setWorkerFolderId("");
    setWorkerEntryForm({
      ...workerEntryInitialForm,
      work_date: todayInputDate(),
    });
  };

  const handleDeleteWorkerEntry = async () => {
    if (!workerEntryToDelete) return;

    try {
      setLoading(true);
      await deleteWorkerEntryApi(workerEntryToDelete.id);
      toast.success("Worker entry deleted successfully");
      setWorkerEntryToDelete(null);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Worker entry delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWorksheet = async () => {
    try {
      setLoading(true);

      await submitWorksheetApi({ note });

      toast.success("Worksheet submitted successfully");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="EMPLOYEE WORK SHEET">
      <div className="space-y-4 sm:space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {runningEntry ? "Current Running Work" : "Add New Work Entry"}
          </h2>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr_1fr_220px_220px]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Folder *
                </label>

                <select
                  value={folderId}
                  onChange={(e) => {
                    setFolderId(e.target.value);
                    setProjectId("");
                  }}
                  disabled={!!runningEntry || isSubmitted}
                  className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  <option value="">Select Folder</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
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
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={!!runningEntry || isSubmitted || !folderId}
                  className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  <option value="">Select Project</option>

                  {filteredProjects.map((item) => (
                    <option key={item.project_id} value={item.project_id}>
                      {item.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Task Title *
                </label>

                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  disabled={!!runningEntry || isSubmitted}
                  className="h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  placeholder="Enter Task Title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Time Count
                </label>

                <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 px-4 font-bold text-slate-900">
                  <Clock size={18} />
                  {runningEntry
                    ? runningTimeText(runningEntry.start_time, now)
                    : "00h 00m 00s"}
                </div>
              </div>

              <div className="flex items-end">
                {runningEntry ? (
                  <button
                    onClick={handleStop}
                    disabled={loading || isSubmitted}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
                  >
                    <Square size={18} />
                    Stop Work
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={loading || isSubmitted}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-600 font-semibold text-white shadow hover:bg-green-700 disabled:opacity-60"
                  >
                    <Play size={18} />
                    Start Work
                  </button>
                  )}
              </div>
            </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setWorkerTimesheetOpen((open) => !open)}
              className="flex flex-1 items-center justify-between gap-4 text-left"
            >
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Hammer size={22} className="text-blue-600" />
                  Worker Timesheet
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {workerTimesheetOpen
                    ? "Hide worker entry form"
                    : "Click to add worker work entry"}
                </p>
              </div>
              <span className="rounded-xl border border-slate-200 p-2 text-slate-600">
                {workerTimesheetOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            </button>

            <span className="w-fit rounded-lg bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
              {workerEntries.length} Worker Entries
            </span>
          </div>

          {workerTimesheetOpen && (
            <>
              <div className="grid gap-4 lg:grid-cols-4">
            <WorkerField label="Select Worker *">
              <select
                value={workerEntryForm.worker_id}
                disabled={loading || isSubmitted}
                onChange={(event) =>
                  setWorkerEntryForm({
                    ...workerEntryForm,
                    worker_id: event.target.value,
                  })
                }
                className="input"
              >
                <option value="">Select Worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name} - {worker.worker_type}
                  </option>
                ))}
              </select>
            </WorkerField>

            <WorkerField label="Select Folder *">
              <select
                value={workerFolderId}
                disabled={loading || isSubmitted}
                onChange={(event) => {
                  setWorkerFolderId(event.target.value);
                  setWorkerEntryForm({
                    ...workerEntryForm,
                    project_id: "",
                  });
                }}
                className="input"
              >
                <option value="">Select Folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.folder_name}
                  </option>
                ))}
              </select>
            </WorkerField>

            <WorkerField label="Select Project *">
              <select
                value={workerEntryForm.project_id}
                disabled={loading || isSubmitted || !workerFolderId}
                onChange={(event) =>
                  setWorkerEntryForm({
                    ...workerEntryForm,
                    project_id: event.target.value,
                  })
                }
                className="input"
              >
                <option value="">Select Project</option>
                {filteredWorkerProjects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </WorkerField>

            {/* <WorkerField label="Work Type *">
              <select
                value={workerEntryForm.work_type}
                disabled={loading || isSubmitted}
                onChange={(event) =>
                  setWorkerEntryForm({
                    ...workerEntryForm,
                    work_type: event.target.value,
                  })
                }
                className="input"
              >
                {WORKER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </WorkerField> */}

            <WorkerField label="Work Date *">
              <input
                type="date"
                value={workerEntryForm.work_date}
                max={todayInputDate()}
                disabled={loading || isSubmitted}
                onChange={(event) =>
                  setWorkerEntryForm({
                    ...workerEntryForm,
                    work_date: event.target.value,
                  })
                }
                className="input"
              />
            </WorkerField>

            <WorkerField label="Task / Work Title *">
              <input
                value={workerEntryForm.task_title}
                disabled={loading || isSubmitted}
                onChange={(event) =>
                  setWorkerEntryForm({
                    ...workerEntryForm,
                    task_title: event.target.value,
                  })
                }
                className="input"
                placeholder="Enter work title"
              />
            </WorkerField>

            <WorkerField label="Start Time *">
              <input
                type="time"
                value={workerEntryForm.start_time}
                disabled={loading || isSubmitted}
                onChange={(event) =>
                  setWorkerEntryForm({
                    ...workerEntryForm,
                    start_time: event.target.value,
                  })
                }
                className="input"
              />
            </WorkerField>

            <WorkerField label="End Time *">
              <input
                type="time"
                value={workerEntryForm.end_time}
                disabled={loading || isSubmitted}
                onChange={(event) =>
                  setWorkerEntryForm({
                    ...workerEntryForm,
                    end_time: event.target.value,
                  })
                }
                className="input"
              />
            </WorkerField>

            <WorkerField label="Total Time">
              <div className="flex h-12 items-center rounded-lg border border-slate-300 px-4 font-bold text-slate-900">
                {workerTimeRangeValid && !workerFormError
                  ? minutesToText(
                      calculateMinutesDiff(
                        workerEntryForm.start_time,
                        workerEntryForm.end_time
                      )
                    )
                  : "--h --m"}
              </div>
            </WorkerField>
          </div>

              {workerFormError && (
                <p className="mt-3 text-sm font-semibold text-red-500">
                  {workerFormError}
                </p>
              )}

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
            <textarea
              value={workerEntryForm.description}
              disabled={loading || isSubmitted}
              onChange={(event) =>
                setWorkerEntryForm({
                  ...workerEntryForm,
                  description: event.target.value,
                })
              }
              rows="3"
              className="w-full rounded-lg border border-slate-300 p-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
              placeholder="Description / Notes *"
            />

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleWorkerEntrySave}
                disabled={loading || isSubmitted || !workerFormComplete || !!workerFormError}
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Save size={18} />
                {editingWorkerEntry ? "Update Entry" : "Save Worker Entry"}
              </button>

              {editingWorkerEntry && (
                <button
                  type="button"
                  onClick={handleWorkerEntryCancel}
                  disabled={loading || isSubmitted}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <X size={18} />
                  Cancel
                </button>
              )}
            </div>
              </div>

              <div className="mt-6 space-y-3 md:hidden">
            {workerEntries.length === 0 ? (
              <EmptyState title="No worker entries added today." />
            ) : (
              workerEntries.map((entry, index) => (
                <MobileCard key={entry.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {entry.worker_name || "-"}
                      </p>
                      <p className="mt-1 truncate text-sm text-blue-700">
                        {entry.project_name || "-"}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {entry.work_type} - {entry.task_title}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                    <EntryMetric label="Start" value={formatTime(entry.start_time)} />
                    <EntryMetric label="End" value={formatTime(entry.end_time)} />
                    <EntryMetric label="Total" value={minutesToText(entry.total_minutes)} />
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {entry.description || "-"}
                  </p>

                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleWorkerEntryEdit(entry)}
                      disabled={loading || isSubmitted}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      aria-label="Edit worker entry"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkerEntryToDelete(entry)}
                      disabled={loading || isSubmitted}
                      className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-60"
                      aria-label="Delete worker entry"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </MobileCard>
              ))
            )}
              </div>

              <div className="mt-6 hidden md:block">
            <Table minWidth="min-w-[1100px]">
              <thead>
                <tr className="border-y bg-slate-50 text-sm text-slate-700">
                  <th className="px-3 py-4">Worker Name</th>
                  <th className="px-3 py-4">Project</th>
                  <th className="px-3 py-4">Work Type</th>
                  <th className="px-3 py-4">Task / Work</th>
                  <th className="px-3 py-4">Start Time</th>
                  <th className="px-3 py-4">End Time</th>
                  <th className="px-3 py-4">Total Time</th>
                  <th className="px-3 py-4">Description</th>
                  <th className="px-3 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {workerEntries.map((entry) => (
                  <tr key={entry.id} className="border-b text-sm">
                    <td className="px-3 py-5 font-semibold text-slate-800">
                      {entry.worker_name || "-"}
                    </td>
                    <td className="px-3 py-5 text-slate-600">
                      {entry.project_name || "-"}
                    </td>
                    <td className="px-3 py-5 text-slate-600">
                      {entry.work_type || "-"}
                    </td>
                    <td className="px-3 py-5 font-medium">
                      {entry.task_title || "-"}
                    </td>
                    <td className="px-3 py-5">{formatTime(entry.start_time)}</td>
                    <td className="px-3 py-5">{formatTime(entry.end_time)}</td>
                    <td className="px-3 py-5 font-semibold">
                      {minutesToText(entry.total_minutes)}
                    </td>
                    <td className="max-w-[260px] px-3 py-5 text-slate-600">
                      {entry.description || "-"}
                    </td>
                    <td className="px-3 py-5">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleWorkerEntryEdit(entry)}
                          disabled={loading || isSubmitted}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                          title="Edit worker entry"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkerEntryToDelete(entry)}
                          disabled={loading || isSubmitted}
                          className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-60"
                          title="Delete worker entry"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {workerEntries.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-slate-500">
                      <EmptyState title="No worker entries added today." />
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              Today's Work Entries
            </h2>

            <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
              {completedEntries.length} Entries
            </span>
          </div>

          <div className="space-y-3 md:hidden">
            {completedEntries.length === 0 ? (
              <EmptyState title="No completed entries added today." />
            ) : (
              completedEntries.map((item, index) =>
                editingEntryId === item.id ? (
                  <MobileCard key={item.id} className="border-blue-200 bg-blue-50/30">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{item.project_name}</p>
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <MobileEditField label="Task Title">
                        <input
                          type="text"
                          disabled={loading || isSubmitted}
                          value={editValues.task_title}
                          onChange={(event) =>
                            setEditValues((previous) => ({
                              ...previous,
                              task_title: event.target.value,
                            }))
                          }
                          className="input h-11"
                          placeholder="Task title"
                        />
                      </MobileEditField>

                      <div className="grid grid-cols-2 gap-3">
                        <MobileEditField label="Start Time">
                          <input
                            type="time"
                            disabled={loading || isSubmitted}
                            value={editValues.start_time}
                            onChange={(event) =>
                              setEditValues((previous) => ({
                                ...previous,
                                start_time: event.target.value,
                              }))
                            }
                            className="input h-11"
                          />
                        </MobileEditField>
                        <MobileEditField label="Stop Time">
                          <input
                            type="time"
                            disabled={loading || isSubmitted}
                            value={editValues.stop_time}
                            onChange={(event) =>
                              setEditValues((previous) => ({
                                ...previous,
                                stop_time: event.target.value,
                              }))
                            }
                            className="input h-11"
                          />
                        </MobileEditField>
                      </div>

                      <MobileEditField label="Total">
                        <p className="rounded-lg bg-white px-3 py-3 font-semibold text-slate-700">
                          {minutesToText(
                            calculateMinutesDiff(editValues.start_time, editValues.stop_time)
                          )}
                        </p>
                      </MobileEditField>

                      <MobileEditField label="Description">
                        <textarea
                          disabled={loading || isSubmitted}
                          value={editValues.description}
                          onChange={(event) =>
                            setEditValues((previous) => ({
                              ...previous,
                              description: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                          placeholder="Add description..."
                          rows="3"
                        />
                      </MobileEditField>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleFullSave(item.id)}
                        disabled={loading || isSubmitted}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        <Save size={17} />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={loading || isSubmitted}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-600 disabled:opacity-60"
                      >
                        <X size={17} />
                        Cancel
                      </button>
                    </div>
                  </MobileCard>
                ) : (
                  <MobileCard key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.task_title}</p>
                        <p className="mt-1 text-sm text-blue-700">{item.project_name}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                      <EntryMetric label="Start" value={formatTime(item.start_time)} />
                      <EntryMetric label="Stop" value={formatTime(item.stop_time)} />
                      <EntryMetric label="Total" value={minutesToText(item.total_minutes)} />
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                        Description
                      </p>
                      {item.description ? (
                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {item.description}
                        </p>
                      ) : (
                        <textarea
                          disabled={isSubmitted}
                          value={descriptions[item.id] || ""}
                          onChange={(event) =>
                            setDescriptions((previous) => ({
                              ...previous,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                          placeholder="Add description..."
                          rows="2"
                        />
                      )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                      {!item.description && (
                        <button
                          type="button"
                          onClick={() => handleDescriptionSave(item.id)}
                          disabled={loading || isSubmitted}
                          className={`rounded-lg border p-2 ${
                            savedDescriptions[item.id]
                              ? "border-green-200 bg-green-50 text-green-600"
                              : "text-blue-600 hover:bg-blue-50"
                          } disabled:opacity-60`}
                          aria-label="Save description"
                        >
                          {savedDescriptions[item.id] ? <Check size={18} /> : <Save size={18} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        disabled={loading || isSubmitted}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                        aria-label="Edit entry"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryToDelete(item)}
                        disabled={loading || isSubmitted}
                        className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-60"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </MobileCard>
                )
              )
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <thead>
                <tr className="border-y bg-slate-50 text-sm text-slate-700">
                  <th className="px-3 py-4">#</th>
                  <th className="px-3 py-4">Project</th>
                  <th className="px-3 py-4">Task Title</th>
                  <th className="px-3 py-4">Start Time</th>
                  <th className="px-3 py-4">Stop Time</th>
                  <th className="px-3 py-4">Total</th>
                  <th className="px-3 py-4">Description</th>
                  <th className="px-3 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {completedEntries.map((item, index) => (
                  editingEntryId === item.id ? (
                    <tr key={item.id} className="border-b bg-blue-50/30 text-sm">
                      <td className="px-3 py-5 font-bold">{index + 1}</td>

                      <td className="border-l-4 border-blue-500 px-4 py-5">
                        <p className="font-medium text-slate-900">
                          {item.project_name}
                        </p>
                      </td>

                      <td className="px-3 py-5">
                        <input
                          type="text"
                          disabled={loading || isSubmitted}
                          value={editValues.task_title}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              task_title: e.target.value,
                            }))
                          }
                          className="w-full min-w-[150px] rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                          placeholder="Task title"
                        />
                      </td>

                      <td className="px-3 py-5">
                        <input
                          type="time"
                          disabled={loading || isSubmitted}
                          value={editValues.start_time}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              start_time: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="px-3 py-5">
                        <input
                          type="time"
                          disabled={loading || isSubmitted}
                          value={editValues.stop_time}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              stop_time: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="px-3 py-5 font-semibold text-slate-700">
                        {minutesToText(
                          calculateMinutesDiff(
                            editValues.start_time,
                            editValues.stop_time
                          )
                        )}
                      </td>

                      <td className="px-3 py-5">
                        <textarea
                          disabled={loading || isSubmitted}
                          value={editValues.description}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full min-w-[280px] rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-blue-500"
                          placeholder="Add description..."
                          rows="2"
                        />
                      </td>

                      <td className="px-3 py-5">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleFullSave(item.id)}
                            disabled={loading || isSubmitted}
                            className="rounded-lg border border-green-200 p-2 text-green-600 hover:bg-green-50 disabled:opacity-60"
                            title="Save Changes"
                          >
                            <Save size={18} />
                          </button>

                          <button
                            onClick={handleCancelEdit}
                            disabled={loading || isSubmitted}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-60"
                            title="Cancel Edit"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id} className="border-b text-sm">
                      <td className="px-3 py-5 font-bold">{index + 1}</td>

                      <td className="border-l-4 border-blue-500 px-4 py-5">
                        <p className="font-medium text-slate-900">
                          {item.project_name}
                        </p>
                      </td>

                      <td className="px-3 py-5 font-medium">
                        {item.task_title}
                      </td>

                      <td className="px-3 py-5">
                        {formatTime(item.start_time)}
                      </td>

                      <td className="px-3 py-5">
                        {formatTime(item.stop_time)}
                      </td>

                      <td className="px-3 py-5 font-semibold">
                        {minutesToText(item.total_minutes)}
                      </td>

                      <td className="px-3 py-5">
                        {item.description ? (
                          <div className="min-w-[280px] rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {item.description}
                          </div>
                        ) : (
                          <textarea
                            disabled={isSubmitted}
                            value={descriptions[item.id] || ""}
                            onChange={(e) =>
                              setDescriptions((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="w-full min-w-[280px] rounded-lg border p-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                            placeholder="Add description..."
                            rows="2"
                          />
                        )}
                      </td>

                      <td className="px-3 py-5">
                        <div className="flex justify-center gap-2">
                          {!item.description && (
                            <button
                              onClick={() => handleDescriptionSave(item.id)}
                              disabled={loading || isSubmitted}
                              className={`rounded-lg border p-2 ${
                                savedDescriptions[item.id]
                                  ? "border-green-200 bg-green-50 text-green-600"
                                  : "text-blue-600 hover:bg-blue-50"
                              } disabled:opacity-60`}
                              title="Save Description"
                            >
                              {savedDescriptions[item.id] ? (
                                <Check size={18} />
                              ) : (
                                <Save size={18} />
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleEditClick(item)}
                            disabled={loading || isSubmitted}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                            title="Edit Entry"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() => setEntryToDelete(item)}
                            disabled={loading || isSubmitted}
                            className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-60"
                            title="Delete Entry"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}

                {completedEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-10 text-center text-slate-500"
                    >
                      <EmptyState title="No completed entries added today." />
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Submit Daily Work Sheet
          </h2>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
                Once submitted, entries cannot be edited.
              </div>

              <label className="mt-4 block text-sm font-semibold">
                Add Note
              </label>

              <textarea
                rows="4"
                value={note}
                disabled={isSubmitted}
                onChange={(e) => setNote(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 p-4 outline-none focus:border-blue-500 disabled:bg-slate-100"
                placeholder="Write additional notes..."
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-5">
              <SummaryRow
                label="My Work Entries"
                value={completedEntries.length}
              />
              <SummaryRow
                label="My Work Total"
                value={minutesToText(ownTotalMinutes)}
              />
              <SummaryRow
                label="Worker Entries"
                value={workerEntries.length}
              />
              <SummaryRow
                label="Worker Work Total"
                value={minutesToText(workerTotalMinutes)}
              />
              <SummaryRow
                label="Grand Total"
                value={minutesToText(ownTotalMinutes + workerTotalMinutes)}
              />
              {/* <SummaryRow
                label="Projects Worked"
                value={summary?.active_projects || 0}
              /> */}
              <SummaryRow
                label="Worksheet Status"
                value={worksheet?.status || "NOT_CREATED"}
              />

              <button
                onClick={handleSubmitWorksheet}
                disabled={
                  loading ||
                  isSubmitted ||
                  (completedEntries.length === 0 && workerEntries.length === 0) ||
                  !!runningEntry
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Send size={18} />
                {isSubmitted ? "Already Submitted" : "Submit Work Sheet"}
              </button>
            </div>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={!!entryToDelete}
        title="Delete work entry?"
        message={`Delete "${entryToDelete?.task_title || "this work entry"}"? This action cannot be undone.`}
        confirmLabel="Delete Entry"
        onCancel={() => setEntryToDelete(null)}
        onConfirm={handleDeleteEntry}
        loading={loading}
      />
      <ConfirmDialog
        open={!!workerEntryToDelete}
        title="Delete worker entry?"
        message={`Delete "${workerEntryToDelete?.task_title || "this worker entry"}"? This action cannot be undone.`}
        confirmLabel="Delete Entry"
        onCancel={() => setWorkerEntryToDelete(null)}
        onConfirm={handleDeleteWorkerEntry}
        loading={loading}
      />
    </DashboardLayout>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function minutesToText(minutes) {
  const total = minutes || 0;
  const h = Math.floor(total / 60);
  const m = total % 60;

  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

function runningTimeText(startTime, now) {
  if (!startTime) return "00h 00m 00s";

  const diffSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000)
  );

  const h = Math.floor(diffSeconds / 3600);
  const m = Math.floor((diffSeconds % 3600) / 60);
  const s = diffSeconds % 60;

  return `${String(h).padStart(2, "0")}h ${String(m).padStart(
    2,
    "0"
  )}m ${String(s).padStart(2, "0")}s`;
}

function WorkerField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function todayInputDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToMinutes(value) {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getWorkerFormError(form, entries, currentId) {
  if (!isWorkerFormComplete(form)) {
    return "";
  }

  if (isFutureDate(form.work_date)) {
    return "Future date is not allowed.";
  }

  if (
    isFutureTime(form.work_date, form.start_time) ||
    isFutureTime(form.work_date, form.end_time)
  ) {
    return "Future time is not allowed.";
  }

  if (!isTimeRangeValid(form.start_time, form.end_time)) {
    return "End time must be greater than start time.";
  }

  if (
    hasTimeOverlap({
      entries,
      start: form.start_time,
      end: form.end_time,
      currentId,
      date: form.work_date,
      dateKey: "work_date",
      startKey: "start_time",
      endKey: "end_time",
      ownerKey: "worker_id",
      ownerId: Number(form.worker_id),
    })
  ) {
    return "This worker already has an entry in this time range.";
  }

  return "";
}

function isWorkerFormComplete(form) {
  return Boolean(
    form.worker_id &&
      form.project_id &&
      form.work_type &&
      form.task_title.trim() &&
      form.description.trim() &&
      form.work_date &&
      form.start_time &&
      form.end_time
  );
}

function isFutureDate(dateValue) {
  return Boolean(dateValue && dateValue > todayInputDate());
}

function isFutureTime(dateValue, timeValue) {
  if (!dateValue || !timeValue || dateValue !== todayInputDate()) return false;
  return timeToMinutes(timeValue) > getCurrentTimeMinutes();
}

function isTimeRangeValid(start, end) {
  return Boolean(start && end && timeToMinutes(end) > timeToMinutes(start));
}

function hasTimeOverlap({
  entries,
  start,
  end,
  currentId,
  date,
  dateKey,
  startKey,
  endKey,
  ownerKey,
  ownerId,
}) {
  if (!isTimeRangeValid(start, end)) return false;

  const newStart = timeToMinutes(start);
  const newEnd = timeToMinutes(end);

  return entries.some((entry) => {
    if (currentId && entry.id === currentId) return false;
    if (ownerKey && Number(entry[ownerKey]) !== Number(ownerId)) return false;

    const entryDate = getDateInputValue(entry[dateKey]);
    if (entryDate !== date) return false;

    const existingStart = getHHMMValue(entry[startKey]);
    const existingEnd = getHHMMValue(entry[endKey]);

    if (!existingStart || !existingEnd) return false;

    return newStart < timeToMinutes(existingEnd) && newEnd > timeToMinutes(existingStart);
  });
}

function getDateInputValue(value) {
  if (!value) return todayInputDate();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (isNaN(date.getTime())) return todayInputDate();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHHMMValue(value) {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getCurrentTimeMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function MobileEditField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function EntryMetric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
