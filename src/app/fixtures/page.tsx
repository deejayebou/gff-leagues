import { MatchCard } from "@/components/match-card";
import { getPublicFixtures } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function FixturesPage() {
  const { fixtures, leagues, teams } = await getPublicFixtures();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-black text-zinc-950">Fixtures</h1>
      <div className="mt-4 grid gap-2 rounded-md border border-zinc-200 bg-white p-3 shadow-sm md:grid-cols-4">
        <select className="h-12 rounded-md border border-zinc-200 px-3"><option>All divisions</option>{leagues.map((league) => <option key={league.slug}>{league.division}</option>)}</select>
        <select className="h-12 rounded-md border border-zinc-200 px-3"><option>All teams</option>{teams.map((team) => <option key={team.slug}>{team.name}</option>)}</select>
        <input className="h-12 rounded-md border border-zinc-200 px-3" type="date" />
        <input className="h-12 rounded-md border border-zinc-200 px-3" placeholder="Venue" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{fixtures.map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div>
    </div>
  );
}
