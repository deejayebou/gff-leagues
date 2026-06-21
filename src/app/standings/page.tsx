import { StandingsTable } from "@/components/standings-table";
import { getPublicStandings } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const standings = await getPublicStandings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-black text-zinc-950">Standings</h1>
      <p className="mt-2 text-zinc-600">Tables are calculated from approved match results only.</p>
      <div className="mt-5 grid gap-6">
        {standings.map(({ league, rows }) => (
          <section key={league.slug}>
            <h2 className="mb-3 text-xl font-bold text-zinc-950">{league.name}</h2>
            <StandingsTable rows={rows} />
          </section>
        ))}
      </div>
    </div>
  );
}
