import { Activity, CheckCircle2, Database, FilePenLine, ShieldCheck, Upload } from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { LogoutButton } from "@/components/logout-button";
import { auditLogSamples, fixtures, leagues, roles, teams } from "@/lib/data";
import { getPrisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import { approveFixture, quickCreateRecord, rejectFixture, updateLeague, updatePlayer, updateTeam } from "./actions";

export const dynamic = "force-dynamic";

async function getAdminData() {
  try {
    const prisma = getPrisma();
    const [dbLeagues, dbTeams, dbPlayers, dbFixtures, dbAuditLogs] = await Promise.all([
      prisma.league.findMany({ orderBy: { name: "asc" }, take: 12 }),
      prisma.team.findMany({ orderBy: { name: "asc" }, take: 12 }),
      prisma.player.findMany({ orderBy: { fullName: "asc" }, take: 12 }),
      prisma.fixture.findMany({
        include: { homeTeam: true, awayTeam: true, venue: true },
        orderBy: { kickoffAt: "desc" },
        take: 12,
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

    return { dbLeagues, dbTeams, dbPlayers, dbFixtures, dbAuditLogs, dbError: "" };
  } catch (error) {
    return {
      dbLeagues: [],
      dbTeams: [],
      dbPlayers: [],
      dbFixtures: [],
      dbAuditLogs: [],
      dbError: error instanceof Error ? error.message : "Could not connect to the database.",
    };
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const status = (await searchParams)?.status;
  const { dbLeagues, dbTeams, dbPlayers, dbFixtures, dbAuditLogs, dbError } = await getAdminData();
  const submitted = fixtures.filter((fixture) => fixture.status === "submitted");
  const submittedDbFixtures = dbFixtures.filter((fixture) => fixture.status === "SUBMITTED");
  const modules = [
    "Create/edit leagues",
    "Create/edit seasons",
    "Create/edit teams",
    "Create/edit players",
    "Assign players to teams",
    "Create fixtures",
    "Enter results",
    "Enter match events",
    "Approve submitted results",
    "Manage venues",
    "Upload team logos and player photos",
    "Search and filter records",
  ];

  return (
    <AdminAuthGate>
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Role-based operations</p>
          <h1 className="text-3xl font-black text-zinc-950">Admin Dashboard</h1>
          <p className="mt-2 text-zinc-600">Designed for Supabase Auth users with enforced roles and auditable data changes.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#d91f2d] px-4 text-sm font-bold text-white"><ShieldCheck size={18} /> Super Admin</div>
          <LogoutButton />
        </div>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-md bg-white p-4 shadow-sm"><Database className="text-emerald-700" /><p className="mt-3 font-mono text-2xl font-bold">{dbLeagues.length || leagues.length}</p><p className="text-sm text-zinc-600">Leagues</p></div>
        <div className="rounded-md bg-white p-4 shadow-sm"><Activity className="text-emerald-700" /><p className="mt-3 font-mono text-2xl font-bold">{dbTeams.length || teams.length}</p><p className="text-sm text-zinc-600">Teams</p></div>
        <div className="rounded-md bg-white p-4 shadow-sm"><FilePenLine className="text-emerald-700" /><p className="mt-3 font-mono text-2xl font-bold">{dbFixtures.length || fixtures.length}</p><p className="text-sm text-zinc-600">Fixtures</p></div>
        <div className="rounded-md bg-white p-4 shadow-sm"><CheckCircle2 className="text-emerald-700" /><p className="mt-3 font-mono text-2xl font-bold">{submittedDbFixtures.length || submitted.length}</p><p className="text-sm text-zinc-600">Pending approval</p></div>
      </section>

      {status ? (
        <section className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {status}
        </section>
      ) : null}

      {dbError ? (
        <section className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <h2 className="font-bold">Database connection needs attention</h2>
          <p className="mt-1">
            The admin editor cannot load records until `DATABASE_URL` and `DIRECT_URL` are updated with the current Supabase database password.
          </p>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-[1fr_0.9fr]">
        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Result Approval Queue</h2>
          <div className="mt-3 grid gap-3">
            {submittedDbFixtures.map((fixture) => (
              <div key={fixture.id} className="rounded-md bg-zinc-50 p-3">
                <p className="font-bold">{fixture.homeTeam.name} {fixture.homeScore}-{fixture.awayScore} {fixture.awayTeam.name}</p>
                <p className="mt-1 text-sm text-zinc-600">Approving this result triggers standings recalculation and creates an audit log entry.</p>
                <div className="mt-3 flex gap-2">
                  <form action={approveFixture}>
                    <input type="hidden" name="id" value={fixture.id} />
                    <button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Approve</button>
                  </form>
                  <form action={rejectFixture}>
                    <input type="hidden" name="id" value={fixture.id} />
                    <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold">Reject</button>
                  </form>
                </div>
              </div>
            ))}
            {submittedDbFixtures.length === 0 ? (
              <p className="rounded-md bg-zinc-50 p-3 text-sm font-semibold text-zinc-600">No submitted results are waiting right now.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Quick Create</h2>
          <form action={quickCreateRecord} className="mt-3 grid gap-2">
            <input name="recordName" className="h-12 rounded-md border border-zinc-200 px-3" placeholder="Record name" />
            <select name="recordType" className="h-12 rounded-md border border-zinc-200 px-3">{modules.slice(0, 6).map((module) => <option key={module}>{module}</option>)}</select>
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white"><Upload size={18} /> Save draft</button>
          </form>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Edit Leagues</h2>
          <div className="mt-3 grid gap-3">
            {dbLeagues.map((league) => (
              <form key={league.id} action={updateLeague} className="grid gap-2 rounded-md bg-zinc-50 p-3 md:grid-cols-[1fr_1fr_2fr_auto]">
                <input type="hidden" name="id" value={league.id} />
                <input name="name" defaultValue={league.name} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="division" defaultValue={league.division} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="description" defaultValue={league.description} className="h-11 rounded-md border border-zinc-200 px-3" />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input name="isActive" type="checkbox" defaultChecked={league.isActive} />
                  Active
                </label>
                <button className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white md:col-start-4">Save</button>
              </form>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Edit Teams</h2>
          <div className="mt-3 grid gap-3">
            {dbTeams.map((team) => (
              <form key={team.id} action={updateTeam} className="grid gap-2 rounded-md bg-zinc-50 p-3 md:grid-cols-2">
                <input type="hidden" name="id" value={team.id} />
                <input name="name" defaultValue={team.name} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="division" defaultValue={team.division} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="homeGround" defaultValue={team.homeGround} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="coach" defaultValue={team.coach} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="logoUrl" defaultValue={team.logoUrl ?? "/gff-logo.jpg"} className="h-11 rounded-md border border-zinc-200 px-3 md:col-span-2" />
                <button className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white md:col-start-2">Save team</button>
              </form>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Edit Players</h2>
          <div className="mt-3 grid gap-3">
            {dbPlayers.map((player) => (
              <form key={player.id} action={updatePlayer} className="grid gap-2 rounded-md bg-zinc-50 p-3 md:grid-cols-2">
                <input type="hidden" name="id" value={player.id} />
                <input name="fullName" defaultValue={player.fullName} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="position" defaultValue={player.position} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="jerseyNumber" type="number" defaultValue={player.jerseyNumber} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="dateOfBirth" type="date" defaultValue={player.dateOfBirth.toISOString().slice(0, 10)} className="h-11 rounded-md border border-zinc-200 px-3" />
                <input name="photoUrl" defaultValue={player.photoUrl ?? "/gff-logo.jpg"} className="h-11 rounded-md border border-zinc-200 px-3 md:col-span-2" />
                <button className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white md:col-start-2">Save player</button>
              </form>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Roles & Permissions</h2>
          <div className="mt-3 grid gap-3">
            {roles.map((role) => (
              <div key={role} className="rounded-md bg-zinc-50 p-3">
                <p className="font-bold">{role}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{permissions[role][0]}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Audit Logs</h2>
          <div className="mt-3 grid gap-2">
            {(dbAuditLogs.length ? dbAuditLogs.map((log) => `${log.action} ${log.entity}`) : auditLogSamples).map((item) => (
              <div key={item} className="rounded-md border border-zinc-100 p-3 text-sm text-zinc-700">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-md bg-[#07120d] p-5 text-white">
        <h2 className="text-lg font-bold">Implementation rulebook</h2>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-white/78 md:grid-cols-2">
          {modules.map((module) => <p key={module}>- {module}</p>)}
        </div>
      </section>
    </div>
    </AdminAuthGate>
  );
}
