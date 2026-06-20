import { MatchCard } from "@/components/match-card";
import { fixtures, matchEvents, playerName, teamName } from "@/lib/data";

export default function ResultsPage() {
  const results = fixtures.filter((fixture) => fixture.status === "approved" || fixture.status === "submitted");
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-black text-zinc-950">Results</h1>
      <div className="mt-5 grid gap-4">
        {results.map((fixture) => (
          <section key={fixture.id} className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
            <MatchCard fixture={fixture} />
            <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="font-bold text-zinc-950">Match events</h2>
              <div className="mt-3 grid gap-2">
                {matchEvents.filter((event) => event.fixtureId === fixture.id).map((event) => (
                  <div key={`${event.fixtureId}-${event.minute}-${event.type}`} className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 p-3 text-sm">
                    <span className="font-mono font-bold">{event.minute}&apos;</span>
                    <span className="flex-1">{event.type}: {playerName(event.playerSlug)}</span>
                    <span className="font-semibold">{teamName(event.teamSlug)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
