import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Profile from "../pages/profile/Profile";
import EmployeeDashboard from "../pages/employee/Dashboard";
import AdminDashboard from "../pages/admin/Dashboard";
import MyTimesheet from "../pages/admin/MyTimesheet";
import SuperAdminDashboard from "../pages/super-admin/Dashboard";
import Projects from "../pages/projects/Projects";
import ProjectDetails from "../pages/projects/ProjectDetails";
import ProjectFolderDetails from "../pages/projects/ProjectFolderDetails";
import MyReports from "../pages/employee/MyReports";
import DailyReports from "../pages/admin/DailyReports";
import Users from "../pages/users/Users";
import UserReportDetails from "../pages/users/UserReportDetails";
import ProjectAccess from "../pages/project-access/ProjectAccess";
import Workers from "../pages/workers/Workers";

import { getUser, isAuthenticated } from "../utils/auth";

function ProtectedRoute({ children, roles }) {
    if (!isAuthenticated()) return <Navigate to="/" />;

    const user = getUser();

    if (!user) return <Navigate to="/" />;

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
}

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route
                    path="/employee/dashboard"
                    element={
                        <ProtectedRoute roles={["EMPLOYEE", "ADMIN", "SUPER_ADMIN"]}>
                            <EmployeeDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/super-admin/dashboard"
                    element={
                        <ProtectedRoute roles={["SUPER_ADMIN"]}>
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/projects"
                    element={
                        <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                            <Projects />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/projects/:projectId"
                    element={
                        <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                            <ProjectDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/project-folders/:folderId"
                    element={
                        <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                            <ProjectFolderDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employee/reports"
                    element={
                        <ProtectedRoute roles={["EMPLOYEE", "ADMIN", "SUPER_ADMIN"]}>
                            <MyReports />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/reports"
                    element={
                        <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                            <DailyReports />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/users"
                    element={
                        <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                            <Users />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/my-timesheet"
                    element={
                        <ProtectedRoute roles={["ADMIN"]}>
                            <MyTimesheet />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/users/:userId/reports"
                    element={
                        <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                            <UserReportDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/project-access"
                    element={
                        <ProtectedRoute
                            roles={["ADMIN", "SUPER_ADMIN"]}
                        >
                            <ProjectAccess />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/workers"
                    element={
                        <ProtectedRoute roles={["EMPLOYEE", "ADMIN", "SUPER_ADMIN"]}>
                            <Workers />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute roles={["EMPLOYEE", "ADMIN", "SUPER_ADMIN"]}>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}
