import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title="Abmelden"
        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-red-400 sm:px-3"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:inline">Abmelden</span>
      </button>
    </form>
  );
}
