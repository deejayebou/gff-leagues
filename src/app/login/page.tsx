import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-8">
      <section className="w-full rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Admin access</p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">Log in</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Use the email and password created in Supabase Auth for GFF Leagues administrators.
        </p>
        <Suspense fallback={<div className="mt-5 h-12 rounded-md bg-zinc-100" />}>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
