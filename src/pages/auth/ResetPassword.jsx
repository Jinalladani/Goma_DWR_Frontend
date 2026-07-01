import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import { forgotPasswordApi } from "../../api/authApi";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve verification details from route state
  const email = location.state?.email;
  const resetToken = location.state?.resetToken;
  const expiresInMinutes = location.state?.expiresInMinutes;

  useEffect(() => {
    // If accessed directly without verification state, redirect to verification page
    if (!email || !resetToken) {
      toast.error("Please verify your email and phone first");
      navigate("/forgot-password");
    }
  }, [email, resetToken, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await forgotPasswordApi({
        reset_token: resetToken,
        password: password.trim(),
      });

      toast.success("Password reset successfully. You can now login.");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !resetToken) {
    return null; // Return null while redirecting
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e9eef6] p-4 md:p-8">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-[30px]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Visual panel */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#0057c2] to-[#3ea1ff] p-8 text-white md:p-14">
            <div className="absolute right-[-60px] top-0 h-full w-[180px]">
              <div className="absolute right-0 h-full w-full rounded-l-[120px] bg-white" />
              <div className="absolute right-[30px] h-full w-full rounded-l-[120px] bg-white/20" />
              <div className="absolute right-[60px] h-full w-full rounded-l-[120px] bg-white/10" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <p className="text-sm tracking-wide opacity-90">Account Security</p>

                <div className="mt-10 flex flex-col items-center lg:items-start">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-600 shadow-xl">
                    <KeyRound size={38} />
                  </div>

                  <h1 className="mt-5 text-4xl font-bold">Reset Password</h1>

                  <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
                    Configure your new password. Make sure to use a secure password to keep your account safe.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form panel */}
          <div className="relative flex items-center justify-center bg-white p-6 md:p-12">
            <div className="w-full max-w-md">
              <div className="mb-10 text-center lg:text-left">
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                >
                  <ArrowLeft size={16} />
                  Back to Verification
                </button>
                <h2 className="mt-4 text-4xl font-bold text-gray-800">New Password</h2>
                <p className="mt-3 text-gray-500">
                  Configure a new password for account <strong>{email}</strong>
                  {expiresInMinutes ? ` within ${expiresInMinutes} minutes` : ""}
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    New Password *
                  </label>
                  <div className="flex items-center border-b-2 border-sky-200 pb-2 transition-all focus-within:border-blue-600">
                    <Lock size={20} className="text-sky-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent px-3 outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} className="text-gray-400" />
                      ) : (
                        <Eye size={20} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Confirm New Password *
                  </label>
                  <div className="flex items-center border-b-2 border-sky-200 pb-2 transition-all focus-within:border-blue-600">
                    <Lock size={20} className="text-sky-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent px-3 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-gradient-to-r from-[#0057c2] to-[#3ea1ff] py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 sm:w-[220px]"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
