import Link from "next/link";
import { Trophy } from "lucide-react";
import { leagues, teams } from "@/lib/data";

export default function LeaguesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-black text-zinc-950">Leagues</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">All Gambian football divisions, youth competitions, cup tournaments, and future women&apos;s leagues in one platform.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {leagues.map((league) => (
          <Link key={league.slug} href={`/leagues/${league.slug}`} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-emerald-100 p-3 text-emerald-800"><Trophy size={22} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d91f2d]">{league.division}</p>
                <h2 className="mt-1 text-lg font-bold text-zinc-950">{league.name}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{league.description}</p>
                <p className="mt-3 text-sm font-semibold text-zinc-800">{teams.filter((team) => team.leagueSlug === league.slug).length} teams · {league.season}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
