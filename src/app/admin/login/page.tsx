"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { supabase } from "@/lib/supabase";
import { Coffee, Eye, EyeOff, Loader2, User, Mail } from "lucide-react";

type LoginType = 'email' | 'employee';

export default function AdminLoginPage() {
  const [loginType, setLoginType] = useState<LoginType>('email');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const browserSupabase = createClient();

    const { data, error: authError } = await browserSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("auth_user_id", data.user.id)
        .single();

      if (adminUser) {
        await supabase.from("admin_sessions").insert({
          admin_user_id: adminUser.id,
          device_info: navigator.userAgent.substring(0, 100),
          ip_address: "Browser",
          status: "active"
        });
      }

      router.push("/admin/dashboard");
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const empIdUpper = employeeId.toUpperCase().trim();
      const empPwd = employeePassword.trim();

      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("employee_id", empIdUpper);

      if (empError) {
        console.error("DB error:", empError);
        setError("Database error. Please try again.");
        setLoading(false);
        return;
      }

      if (!employees || employees.length === 0) {
        setError("Employee ID not found.");
        setLoading(false);
        return;
      }

      const employee = employees[0];

      if (employee.password !== empPwd) {
        setError("Invalid password.");
        setLoading(false);
        return;
      }

      if (!employee.is_active) {
        setError("This account has been deactivated. Contact admin.");
        setLoading(false);
        return;
      }

      localStorage.setItem('employee_session', JSON.stringify({
        id: employee.id,
        employee_id: employee.employee_id,
        name: employee.name,
        role: employee.role,
        logged_in_at: new Date().toISOString()
      }));

      router.push("/admin/dashboard");
    } catch (err) {
      console.error("Employee login error:", err);
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1512] to-[#2d241e] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Coffee className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary">CAFE REPUBLIC</h1>
            <p className="text-sm text-muted-foreground mt-1">Admin Dashboard Login</p>
          </div>

          <div className="flex rounded-xl bg-muted/50 p-1 mb-6">
            <button
              onClick={() => { setLoginType('email'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loginType === 'email' 
                  ? 'bg-white shadow text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-4 h-4" />
              Admin Email
            </button>
            <button
              onClick={() => { setLoginType('employee'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loginType === 'employee' 
                  ? 'bg-white shadow text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-4 h-4" />
              Employee ID
            </button>
          </div>

          {loginType === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@caferepublic.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In with Email"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmployeeLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  placeholder="EMP1234"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In with Employee ID"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Back to Website
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          Authorized personnel only. All activities are logged.
        </p>
      </div>
    </div>
  );
}

// sync: 2026-01-23 00:35:39
