import Link from "next/link";
import { Search, ShieldCheck, TrendingUp } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { PlayerCard } from "@/components/player-card";
import { Section } from "@/components/section";
import { StandingsTable } from "@/components/standings-table";
import { fixtures, leagues, players, teams } from "@/lib/data";

export default function Home() {
  const upcoming = fixtures.filter((fixture) => fixture.status === "scheduled").slice(0, 3);
  const results = fixtures.filter((fixture) => fixture.status === "approved").slice(0, 2);
  const featured = fixtures[2];

  return (
    <div>
      <section className="bg-[#07120d] text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-7 md:grid-cols-[1.1fr_0.9fr] md:py-10">
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">Official football data hub</p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">GFF Leagues</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/78">
              Fixtures, results, squads, player stats, and approved standings for Gambian football from First Division to youth and future women&apos;s leagues.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-white/10 p-3">
                <p className="font-mono text-2xl font-bold">{leagues.length}</p>
                <p className="text-xs text-white/70">Leagues</p>
              </div>
              <div className="rounded-md bg-white/10 p-3">
                <p className="font-mono text-2xl font-bold">{teams.length}</p>
                <p className="text-xs text-white/70">Teams</p>
              </div>
              <div className="rounded-md bg-white/10 p-3">
                <p className="font-mono text-2xl font-bold">{players.length}</p>
                <p className="text-xs text-white/70">Players</p>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <TrendingUp size={18} /> Featured match
            </div>
            <MatchCard fixture={featured} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <form id="search" className="-mt-5 flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2 shadow-lg">
          <Search className="ml-2 text-zinc-500" size={20} />
          <input className="min-h-12 flex-1 bg-transparent text-base outline-none" placeholder="Search teams or players" />
          <button className="h-11 rounded-md bg-[#d91f2d] px-4 text-sm font-bold text-white">Search</button>
        </form>

        <Section title="Upcoming Fixtures" action={<Link href="/fixtures" className="text-sm font-bold text-emerald-700">View all</Link>}>
          <div className="grid gap-3 md:grid-cols-3">{upcoming.map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div>
        </Section>

        <Section title="Latest Results" action={<Link href="/results" className="text-sm font-bold text-emerald-700">Results</Link>}>
          <div className="grid gap-3 md:grid-cols-2">{results.map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div>
        </Section>

        <Section title="First Division Standings" eyebrow="Auto-updated after approval" action={<Link href="/standings" className="text-sm font-bold text-emerald-700">Full table</Link>}>
          <StandingsTable compact />
        </Section>

        <Section title="Top Scorers" action={<Link href="/leagues/first-division" className="text-sm font-bold text-emerald-700">League detail</Link>}>
          <div className="grid gap-3 md:grid-cols-2">{players.slice(0, 4).map((player) => <PlayerCard key={player.id} player={player} />)}</div>
        </Section>

        <section className="my-6 rounded-md bg-[#0f7a3c] p-5 text-white">
          <ShieldCheck className="mb-3" />
          <h2 className="text-xl font-bold">Admin workflow built for trust</h2>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Match officials submit scores and events, Super Admins approve or reject results, and standings update from approved matches only.
          </p>
          <Link href="/admin" className="mt-4 inline-flex rounded-md bg-white px-4 py-3 text-sm font-bold text-[#0f7a3c]">Open dashboard</Link>
        </section>
      </div>
    </div>
  );
}
