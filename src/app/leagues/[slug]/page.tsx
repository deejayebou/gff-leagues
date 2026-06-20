import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchCard } from "@/components/match-card";
import { PlayerCard } from "@/components/player-card";
import { Section } from "@/components/section";
import { StandingsTable } from "@/components/standings-table";
import { fixturesForLeague, getLeague, players, teams } from "@/lib/data";

export default async function LeagueDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const league = getLeague(slug);
  if (!league) notFound();
  const leagueFixtures = fixturesForLeague(slug);
  const leagueTeams = teams.filter((team) => team.leagueSlug === slug);
  const leaguePlayers = players.filter((player) => leagueTeams.some((team) => team.slug === player.teamSlug));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{league.division}</p>
      <h1 className="mt-1 text-3xl font-black text-zinc-950">{league.name}</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">{league.description}</p>
      <Section title="League Table" eyebrow="Approved results only"><StandingsTable leagueSlug={slug} /></Section>
      <Section title="Fixtures"><div className="grid gap-3 md:grid-cols-2">{leagueFixtures.filter((fixture) => fixture.status === "scheduled").map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div></Section>
      <Section title="Results"><div className="grid gap-3 md:grid-cols-2">{leagueFixtures.filter((fixture) => fixture.status === "approved").map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div></Section>
      <Section title="Top Scorers"><div className="grid gap-3 md:grid-cols-2">{leaguePlayers.slice(0, 4).map((player) => <PlayerCard key={player.id} player={player} />)}</div></Section>
      <Section title="Teams"><div className="grid gap-3 md:grid-cols-3">{leagueTeams.map((team) => <Link key={team.slug} href={`/teams/${team.slug}`} className="rounded-md border border-zinc-200 bg-white p-4 font-bold shadow-sm">{team.name}</Link>)}</div></Section>
    </div>
  );
}
