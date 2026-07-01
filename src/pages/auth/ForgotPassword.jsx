import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Phone, KeyRound, ArrowLeft } from "lucide-react";
import { requestPasswordResetApi } from "../../api/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email.trim() || !phone.trim()) {
      toast.error("Please fill in both Email and Phone Number");
      return;
    }

    try {
      setLoading(true);

      const res = await requestPasswordResetApi({
        email: email.trim(),
        phone: phone.trim(),
      });

      toast.success("Verification successful. Please configure your new password.");

      navigate("/reset-password", {
        state: {
          email: email.trim(),
          resetToken: res.reset_token,
          expiresInMinutes: res.expires_in_minutes,
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

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

                  <h1 className="mt-5 text-4xl font-bold">Forgot Password</h1>

                  <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
                    Verify your pre-registered email address and phone number to begin password recovery.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form panel */}
          <div className="relative flex items-center justify-center bg-white p-6 md:p-12">
            <div className="w-full max-w-md">
              <div className="mb-10 text-center lg:text-left">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </a>
                <h2 className="mt-4 text-4xl font-bold text-gray-800">Verification</h2>
                <p className="mt-3 text-gray-500">
                  Verify identity using registered email and phone number
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Email Address *
                  </label>
                  <div className="flex items-center border-b-2 border-sky-200 pb-2 transition-all focus-within:border-blue-600">
                    <Mail size={20} className="text-sky-500" />
                    <input
                      type="email"
                      placeholder="Enter your registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent px-3 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Phone Number *
                  </label>
                  <div className="flex items-center border-b-2 border-sky-200 pb-2 transition-all focus-within:border-blue-600">
                    <Phone size={20} className="text-sky-500" />
                    <input
                      type="text"
                      placeholder="Enter your registered phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                    {loading ? "Verifying..." : "Verify & Continue"}
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
