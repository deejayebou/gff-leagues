import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { age, getPublicPlayer } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await getPublicPlayer(slug);
  if (!player) notFound();
  const statCards = [
    ["Goals", player.stats.goals],
    ["Assists", player.stats.assists],
    ["Apps", player.stats.appearances],
    ["Yellow", player.stats.yellowCards],
    ["Red", player.stats.redCards],
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <section className="rounded-md bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Image src={player.photoUrl} alt="" width={96} height={96} className="h-24 w-24 rounded-md object-cover" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{player.position} · #{player.jerseyNumber}</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950">{player.fullName}</h1>
            {player.teamSlug ? <Link href={`/teams/${player.teamSlug}`} className="mt-2 inline-flex text-sm font-bold text-[#d91f2d]">{player.teamName}</Link> : null}
          </div>
        </div>
        <div className="mt-5 grid gap-2 text-sm md:grid-cols-3">
          <p><span className="font-bold">Date of birth:</span> {player.dateOfBirth}</p>
          <p><span className="font-bold">Age:</span> {age(player.dateOfBirth)}</p>
          <p><span className="font-bold">Division:</span> {player.division ?? "Unassigned"}</p>
          <p><span className="font-bold">Hometown:</span> {player.hometown ?? "To be confirmed"}</p>
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
