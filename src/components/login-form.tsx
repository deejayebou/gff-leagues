"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { loginWithPassword } from "@/app/login/actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const error = searchParams.get("error");
  const next = searchParams.get("next") || "/admin";

  return (
    <form className="mt-5 grid gap-4" action={loginWithPassword}>
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-emerald-700"
          autoComplete="email"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Password
        <span className="flex h-12 items-center rounded-md border border-zinc-300 pr-2 focus-within:border-emerald-700">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
            className="rounded-md p-2 text-zinc-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#d91f2d] px-4 text-sm font-bold text-white disabled:opacity-70"
      >
        <LogIn size={18} />
        Log in
      </button>
    </form>
  );
}
