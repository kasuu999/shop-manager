import { Store } from "lucide-react";

// Login is intentionally NOT functional yet — this is just the page shell
// and layout, wired up to real auth in a later step.
export default function Login() {
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

        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              disabled
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 placeholder:text-slate-400 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 placeholder:text-slate-400 disabled:bg-slate-50"
            />
          </div>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-brand-500/50 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Sign In (coming soon)
          </button>
        </form>
      </div>
    </div>
  );
}
