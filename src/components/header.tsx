import Image from "next/image";
import Link from "next/link";
import { Shield, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07120d]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image src="/gff-logo.jpg" alt="Gambia Football Federation logo" width={42} height={42} className="h-10 w-10 rounded-md object-cover" priority />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">GFF Leagues</p>
            <p className="truncate text-sm font-semibold">Gambia Football Federation</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-white/80 md:flex">
          <Link href="/leagues">Leagues</Link>
          <Link href="/fixtures">Fixtures</Link>
          <Link href="/results">Results</Link>
          <Link href="/standings">Standings</Link>
          <Link href="/login">Login</Link>
          <Link href="/admin" className="rounded-md bg-white px-3 py-2 text-[#07120d]">Admin</Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link aria-label="Search" href="/#search" className="rounded-md border border-white/15 p-2">
            <Search size={18} />
          </Link>
          <Link aria-label="Admin" href="/admin" className="rounded-md bg-white p-2 text-[#07120d]">
            <Shield size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
