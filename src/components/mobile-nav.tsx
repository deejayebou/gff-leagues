import Link from "next/link";
import { CalendarDays, Home, ListOrdered, Newspaper, Trophy } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/leagues", label: "Leagues", icon: Trophy },
  { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { href: "/standings", label: "Table", icon: ListOrdered },
  { href: "/news", label: "News", icon: Newspaper },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold text-zinc-700">
              <Icon size={19} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
