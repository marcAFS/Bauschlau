import { HardHat, Lock } from "lucide-react";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-500/20">
            <HardHat className="h-6 w-6 text-zinc-950" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold text-zinc-50">Bau-Schlau</h1>
            <p className="text-xs text-zinc-500">Dein intelligenter 3D-Bauleiter &amp; Sanierungs-Hub</p>
          </div>
        </div>

        <form action={loginAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Lock className="h-3.5 w-3.5" /> Passwort
            </label>
            <input
              type="password"
              name="password"
              autoFocus
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          {params.error && <p className="text-xs text-red-400">Falsches Passwort. Bitte erneut versuchen.</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-orange-400"
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
