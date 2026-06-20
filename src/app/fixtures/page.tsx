import { MatchCard } from "@/components/match-card";
import { fixtures, leagues, teams } from "@/lib/data";

export default function FixturesPage() {
  const upcoming = fixtures.filter((fixture) => fixture.status === "scheduled" || fixture.status === "submitted");
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-black text-zinc-950">Fixtures</h1>
      <div className="mt-4 grid gap-2 rounded-md border border-zinc-200 bg-white p-3 shadow-sm md:grid-cols-4">
        <select className="h-12 rounded-md border border-zinc-200 px-3"><option>All divisions</option>{leagues.map((league) => <option key={league.slug}>{league.division}</option>)}</select>
        <select className="h-12 rounded-md border border-zinc-200 px-3"><option>All teams</option>{teams.map((team) => <option key={team.slug}>{team.name}</option>)}</select>
        <input className="h-12 rounded-md border border-zinc-200 px-3" type="date" />
        <input className="h-12 rounded-md border border-zinc-200 px-3" placeholder="Venue" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{upcoming.map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div>
    </div>
  );
}
