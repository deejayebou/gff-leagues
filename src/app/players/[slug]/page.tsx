import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { age, getPlayer, getTeam, playerStats } from "@/lib/data";

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = getPlayer(slug);
  if (!player) notFound();
  const team = getTeam(player.teamSlug);
  const stats = playerStats(slug);
  const statCards = [
    ["Goals", stats?.goals ?? 0],
    ["Assists", stats?.assists ?? 0],
    ["Apps", stats?.appearances ?? 0],
    ["Yellow", stats?.yellowCards ?? 0],
    ["Red", stats?.redCards ?? 0],
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <section className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Image src={player.photoUrl} alt="" width={96} height={96} className="h-24 w-24 rounded-md object-cover" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{player.position} · #{player.jerseyNumber}</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950">{player.fullName}</h1>
            {team ? <Link href={`/teams/${team.slug}`} className="mt-2 inline-flex text-sm font-bold text-[#d91f2d]">{team.name}</Link> : null}
          </div>
        </div>
        <div className="mt-5 grid gap-2 text-sm md:grid-cols-3">
          <p><span className="font-bold">Date of birth:</span> {player.dateOfBirth}</p>
          <p><span className="font-bold">Age:</span> {age(player.dateOfBirth)}</p>
          <p><span className="font-bold">Division:</span> {team?.division}</p>
        </div>
      </section>
      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
        {statCards.map(([label, value]) => (
          <div key={label} className="rounded-md bg-zinc-950 p-4 text-center text-white">
            <p className="font-mono text-3xl font-bold">{value}</p>
            <p className="text-xs font-semibold uppercase text-white/60">{label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
