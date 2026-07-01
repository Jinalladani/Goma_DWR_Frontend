import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { User, Mail, Phone, Shield, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/Loader";
import { profileApi, updateProfileApi, changePasswordApi } from "../../api/authApi";
import { saveAuth } from "../../utils/auth";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Edit details state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await profileApi();
      if (res.success && res.user) {
        setProfile(res.user);
        setName(res.user.name || "");
        setPhone(res.user.phone || "");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchProfile();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setLoading(true);
      const res = await updateProfileApi({
        full_name: name.trim(),
        phone: phone.trim(),
      });

      if (res.success && res.user) {
        setProfile(res.user);

        // Update local auth storage to reflect immediate changes in Header
        const currentToken = localStorage.getItem("goma_token");
        saveAuth(currentToken, res.user);

        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await changePasswordApi({
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (res.success) {
        toast.success("Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!profile && loading) {
    return (
      <DashboardLayout title="MY PROFILE">
        <div className="flex h-[400px] items-center justify-center">
          <Loader message="Loading profile..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="MY PROFILE">
      <div className="space-y-4 sm:space-y-8">
        {/* Profile Info Header Card */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="absolute right-0 top-0 h-full w-[25%] opacity-10 bg-gradient-to-l from-blue-500 to-transparent pointer-events-none" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            {/* Avatar block */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0057c2] to-[#3ea1ff] text-2xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-3xl">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* Profile Info details */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {profile?.name || "User Name"}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  <Shield size={12} />
                  {profile?.role || "Employee"}
                </span>
                {profile?.is_active && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                    <CheckCircle size={12} />
                    Active
                  </span>
                )}
              </div>

              <div className="grid gap-x-6 gap-y-2 text-sm text-slate-600 sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  {profile?.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" />
                  {profile?.phone || "No phone added"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dual panel components */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Card 1: Edit Profile details */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <User size={20} className="text-blue-600" />
              Update Account Details
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Update your full name and primary phone number
            </p>

            <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <User size={18} className="mr-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm outline-none placeholder:text-slate-400"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone Number
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Phone size={18} className="mr-3 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm outline-none placeholder:text-slate-400"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address (Read-only)
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Mail size={18} className="mr-3 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ""}
                    className="w-full text-sm outline-none text-slate-500 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>

          {/* Card 2: Security settings (Change Password) */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <Lock size={20} className="text-blue-600" />
              Update Account Password
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Change your password by verifying your current login credentials
            </p>

            <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Current Password *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Lock size={18} className="mr-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full text-sm outline-none placeholder:text-slate-400"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  New Password *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Lock size={18} className="mr-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-sm outline-none placeholder:text-slate-400"
                    placeholder="Create a strong password"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm New Password *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Lock size={18} className="mr-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-sm outline-none placeholder:text-slate-400"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
