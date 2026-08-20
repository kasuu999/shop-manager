import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store } from "lucide-react";
import api from "../api/axiosInstance.js";

export default function Login() {
  const navigate = useNavigate();

  // Backend expects { number, password } — not email — so the form field
  // is "number" to match exactly what POST /api/auth/login reads from req.body.
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/users/login", { number, password });
      const { token, user } = response.data;

      // Save the JWT so the shared Axios instance can attach it to future
      // requests (see the request interceptor in axiosInstance.js).
      localStorage.setItem("token", token);

      // Save user info too (name, role, etc.) — useful later for showing
      // "Owner"/"Staff" in the header and for role-based UI decisions.
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role: owner sees the full dashboard, staff goes
      // straight to Sales since that (along with Products) is all they
      // have access to.
      if (user?.role === "owner") {
        navigate("/dashboard");
      } else {
        navigate("/sales");
      }
    } catch (err) {
      // Backend sends { success: false, message: "..." } on failure
      const message = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Store size={20} />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Shop Manager</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              placeholder="9876543210"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-500/50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}