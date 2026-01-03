import React, { useState, useEffect } from "react";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ChevronRight, Globe, ShieldCheck } from "lucide-react";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load saved credentials
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const savedEmail = localStorage.getItem("admin_remembered_email");
        const savedPassword = localStorage.getItem("admin_remembered_password");
        const savedRememberMe = localStorage.getItem("admin_remember_me") === "true";

        if (savedEmail && savedPassword && savedRememberMe) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      }
    } catch (error) {
      console.warn("Storage access not allowed");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(email, password);

      if (rememberMe) {
        localStorage.setItem("admin_remembered_email", email);
        localStorage.setItem("admin_remembered_password", password);
        localStorage.setItem("admin_remember_me", "true");
      } else {
        localStorage.removeItem("admin_remembered_email");
        localStorage.removeItem("admin_remembered_password");
        localStorage.removeItem("admin_remember_me");
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";
      if (err?.response?.data?.error) errorMessage = err.response.data.error;
      else if (err?.message) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] flex overflow-hidden min-h-[700px]">
        {/* Left Panel: Visual/Branding (Hidden on mobile) */}
        <div className="hidden lg:flex w-1/2 bg-white relative items-center justify-center p-12 overflow-hidden border-r border-slate-100">
          {/* Abstract Background Elements */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-purple-50 rounded-full blur-[100px] opacity-50"></div>

          <div className="w-full relative z-10 -translate-y-10">
            <div className="mb-0">
              <img src="/logo.png" alt="KareerGrowth" className="h-16 w-auto mb-6" />
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium tracking-wide uppercase mb-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Certified Administrator Portal</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                Empowering the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Future of Talent</span> Management.
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed max-w-md">
                Access your highly secure admin dashboard to manage candidates,
                orchestrate assessments, and drive growth with data-driven insights.
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 left-12 flex items-center gap-6 text-slate-400 text-sm">
            <div className="flex items-center gap-1.5 hover:text-slate-600 cursor-pointer transition-colors">
              <Globe className="w-4 h-4" /> Global Infrastructure
            </div>
            <span>&bull;</span>
            <span>v2.4.0 (Stable)</span>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50/30">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-10 text-xl font-bold">
              <img src="/logo.png" alt="KareerGrowth" className="h-12 w-auto mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
            </div>

            <div className="relative">
              {/* Subtle glow effect */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

              <div className="relative z-10">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                  <p className="text-slate-500 font-medium">Please enter your details to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5 ml-1">
                      Work Email
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        placeholder="name@kareergrowth.com"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 shadow-sm transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5 ml-1 flex justify-between">
                      Password
                      <button type="button" className="text-blue-600 hover:text-blue-700 text-xs font-medium focus:outline-none">Forgot?</button>
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        placeholder="••••••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 shadow-sm transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <div className="w-5 h-5 bg-slate-100 border border-slate-200 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                        <svg className="absolute w-3.5 h-3.5 text-white top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Keep me signed in</span>
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Dashboard Login"
                    )}
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="text-slate-400 text-sm font-medium">
                Don't have an account? <span className="text-blue-600 hover:text-blue-700 cursor-pointer hover:underline underline-offset-4">Contact Support</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
