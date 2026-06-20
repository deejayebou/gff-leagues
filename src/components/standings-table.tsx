import Link from "next/link";
import { computeStandings } from "@/lib/data";

export function StandingsTable({ leagueSlug = "first-division", compact = false }: { leagueSlug?: string; compact?: boolean }) {
  const rows = computeStandings(leagueSlug);
  const visibleRows = compact ? rows.slice(0, 4) : rows;

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase tracking-[0.12em] text-white">
            <tr>
              <th className="px-3 py-3">Club</th>
              <th className="px-2 py-3 text-center">P</th>
              <th className="px-2 py-3 text-center">W</th>
              <th className="px-2 py-3 text-center">D</th>
              <th className="px-2 py-3 text-center">L</th>
              <th className="px-2 py-3 text-center">GF</th>
              <th className="px-2 py-3 text-center">GA</th>
              <th className="px-2 py-3 text-center">GD</th>
              <th className="px-3 py-3 text-center">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visibleRows.map((row, index) => (
              <tr key={row.team.slug}>
                <td className="px-3 py-3">
                  <Link href={`/teams/${row.team.slug}`} className="font-semibold text-zinc-950">
                    {index + 1}. {row.team.name}
                  </Link>
                </td>
                <td className="px-2 py-3 text-center">{row.played}</td>
                <td className="px-2 py-3 text-center">{row.wins}</td>
                <td className="px-2 py-3 text-center">{row.draws}</td>
                <td className="px-2 py-3 text-center">{row.losses}</td>
                <td className="px-2 py-3 text-center">{row.goalsFor}</td>
                <td className="px-2 py-3 text-center">{row.goalsAgainst}</td>
                <td className="px-2 py-3 text-center">{row.goalDifference}</td>
                <td className="px-3 py-3 text-center font-mono font-bold">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
