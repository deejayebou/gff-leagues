"use client";

import type { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setSession(null);
        setIsLoading(false);
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setSession(data.session);
      setIsLoading(false);

      if (!data.session) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }).catch(() => {
      setSession(null);
      setIsLoading(false);
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-10">
        <div className="rounded-md border border-zinc-200 bg-white p-5 text-sm font-semibold text-zinc-700 shadow-sm">
          Checking admin access...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return children;
}
