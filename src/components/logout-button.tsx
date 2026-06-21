"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
      type="submit"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-950"
    >
      <LogOut size={18} />
      Log out
    </button>
    </form>
  );
}
