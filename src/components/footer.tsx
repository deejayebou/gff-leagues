import Image from "next/image";
import Link from "next/link";
import { Database, Mail, MapPin, ShieldCheck } from "lucide-react";

const platformLinks = [
  { href: "/", label: "Home" },
  { href: "/leagues", label: "Leagues" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/standings", label: "Standings" },
  { href: "/news", label: "News" },
];

const competitionLinks = [
  { href: "/leagues/first-division", label: "First Division" },
  { href: "/leagues/second-division", label: "Second Division" },
  { href: "/leagues/third-division", label: "Third Division" },
  { href: "/leagues/youth-u20", label: "Youth Leagues" },
  { href: "/leagues/ff-cup", label: "Cup Tournaments" },
];

const operationsLinks = [
  { href: "/admin", label: "Admin Dashboard" },
  { href: "/login", label: "Staff Login" },
  { href: "/fixtures", label: "Match Centre" },
  { href: "/standings", label: "Official Tables" },
];

export function Footer() {
  return (
    <footer className="border-t border-emerald-900/30 bg-[#07120d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Image src="/gff-logo.jpg" alt="Gambia Football Federation logo" width={56} height={56} className="h-14 w-14 rounded-md object-cover" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">GFF Leagues</p>
                <p className="mt-1 text-lg font-black">Gambia Football Federation</p>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
              Official football data platform for Gambian leagues, fixtures, results, standings, clubs, players, and federation competition updates.
            </p>
            <div className="mt-5 grid gap-3 text-sm text-white/75">
              <p className="flex items-center gap-2"><MapPin size={17} className="text-emerald-300" /> Kanifing, The Gambia</p>
              <p className="flex items-center gap-2"><Mail size={17} className="text-emerald-300" /> info@gff.gm</p>
              <p className="flex items-center gap-2"><Database size={17} className="text-emerald-300" /> Approved results power public standings</p>
            </div>
          </div>

          <div className="grid gap-7 sm:grid-cols-3">
            <FooterColumn title="Platform" links={platformLinks} />
            <FooterColumn title="Competitions" links={competitionLinks} />
            <FooterColumn title="Operations" links={operationsLinks} />
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-4 border-t border-white/10 pt-5 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© 2026 GFF Leagues. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <ShieldCheck size={17} className="text-emerald-300" />
            Role-based access, result approvals, and audit logs.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{title}</h2>
      <nav className="mt-4 grid gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-semibold text-white/72 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
