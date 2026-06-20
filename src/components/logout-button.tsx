"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-950"
    >
      <LogOut size={18} />
      Log out
    </button>
  );
}
