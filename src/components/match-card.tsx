import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { formatDateTime, type PublicFixture } from "@/lib/public-data";

export function MatchCard({ fixture }: { fixture: PublicFixture }) {
  const isResult = fixture.homeScore !== undefined && fixture.awayScore !== undefined;

  return (
    <article className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        <span>{fixture.status}</span>
        <span>{isResult ? "FT" : "Upcoming"}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
        <Link href={`/teams/${fixture.homeTeamSlug}`} className="font-bold text-zinc-950">{fixture.homeTeamName}</Link>
        <div className="rounded-md bg-zinc-950 px-3 py-2 font-mono text-base font-bold text-white">
          {isResult ? `${fixture.homeScore}-${fixture.awayScore}` : "vs"}
        </div>
        <Link href={`/teams/${fixture.awayTeamSlug}`} className="text-right font-bold text-zinc-950">{fixture.awayTeamName}</Link>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-zinc-600">
        <div className="flex items-center gap-2"><Clock size={16} /> {formatDateTime(fixture.kickoffAt)}</div>
        <div className="flex items-center gap-2"><MapPin size={16} /> {fixture.venue}</div>
      </div>
    </article>
  );
}
