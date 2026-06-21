import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchCard } from "@/components/match-card";
import { PlayerCard } from "@/components/player-card";
import { Section } from "@/components/section";
import { getPublicTeam } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function TeamProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getPublicTeam(slug);
  if (!team) notFound();
  const approved = team.fixtures.filter((fixture) => fixture.status === "approved");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="rounded-md bg-[#07120d] p-5 text-white">
        <Image src={team.logoUrl} alt="" width={82} height={82} className="h-20 w-20 rounded-md object-cover" />
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">{team.division}</p>
        <h1 className="mt-1 text-3xl font-black">{team.name}</h1>
        <div className="mt-4 grid gap-3 text-sm text-white/80 md:grid-cols-3">
          <p><span className="font-bold text-white">Home:</span> {team.homeGround}</p>
          <p><span className="font-bold text-white">City/Town:</span> {team.city ?? "To be confirmed"}</p>
          <p><span className="font-bold text-white">Coach:</span> {team.coach}</p>
        </div>
      </section>
      <Section title="Team Stats">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-white p-4 shadow-sm"><p className="font-mono text-2xl font-bold">{team.played}</p><p className="text-xs font-semibold text-zinc-500">Played</p></div>
          <div className="rounded-md bg-white p-4 shadow-sm"><p className="font-mono text-2xl font-bold">{team.goalsFor}</p><p className="text-xs font-semibold text-zinc-500">Goals</p></div>
          <div className="rounded-md bg-white p-4 shadow-sm"><p className="font-mono text-2xl font-bold">{team.squad.length}</p><p className="text-xs font-semibold text-zinc-500">Squad</p></div>
        </div>
      </Section>
      <Section title="Squad List"><div className="grid gap-3 md:grid-cols-2">{team.squad.map((player) => <PlayerCard key={player.id} player={player} />)}</div></Section>
      <Section title="Fixtures"><div className="grid gap-3 md:grid-cols-2">{team.fixtures.filter((fixture) => fixture.status === "scheduled").map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div></Section>
      <Section title="Results"><div className="grid gap-3 md:grid-cols-2">{approved.map((fixture) => <MatchCard key={fixture.id} fixture={fixture} />)}</div></Section>
      <Link href={`/leagues/${team.leagueSlug}`} className="inline-flex rounded-md bg-zinc-950 px-4 py-3 text-sm font-bold text-white">Back to league</Link>
    </div>
  );
}
