import Image from "next/image";
import Link from "next/link";
import { type Player, age, playerStats, teamName } from "@/lib/data";

export function PlayerCard({ player }: { player: Player }) {
  const stats = playerStats(player.slug);

  return (
    <Link href={`/players/${player.slug}`} className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
      <Image src={player.photoUrl} alt="" width={46} height={46} className="h-12 w-12 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-zinc-950">{player.fullName}</p>
        <p className="truncate text-sm text-zinc-600">#{player.jerseyNumber} {player.position} · {teamName(player.teamSlug)} · {age(player.dateOfBirth)}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-lg font-bold text-emerald-700">{stats?.goals ?? 0}</p>
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Goals</p>
      </div>
    </Link>
  );
}
