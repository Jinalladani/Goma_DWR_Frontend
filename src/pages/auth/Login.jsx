import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { loginApi } from "../../api/authApi";
import AuthLayout from "../../components/AuthLayout";
import { getDashboardPath, getUser, isAuthenticated, saveAuth } from "../../utils/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      window.location.href = getDashboardPath(getUser());
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await loginApi({
        email,
        password,
      });

      saveAuth(res.access_token || res.token, res.user, res.refresh_token);

      toast.success("Login successful");

      window.location.href = getDashboardPath(res.user);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Goma DWR"
      subtitle="Track projects, employees and daily work reports."
      heading="Goma DWR"
      description="Management Center Login!"
    >
      <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-white">
            Email Address
          </label>
          <div className="flex h-12 items-center rounded-lg bg-[#eaf1fb] px-4 text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-[#38bdf8] sm:h-14">
            <Mail size={19} className="text-slate-400" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-full w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-white">
            Password
          </label>
          <div className="flex h-12 items-center rounded-lg bg-[#eaf1fb] px-4 text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-[#38bdf8] sm:h-14">
            <Lock size={19} className="text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-full w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-white">
          <label className="inline-flex items-center gap-2 font-medium">
            <input type="checkbox" className="h-4 w-4 rounded border-white/40" />
            Remember me
          </label>
          <a href="/forgot-password" className="font-semibold text-white hover:text-blue-200 hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-lg bg-white font-extrabold text-[#172235] shadow-lg transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
