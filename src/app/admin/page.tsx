import { Activity, CheckCircle2, Database, FilePenLine, ShieldCheck, Upload } from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { LogoutButton } from "@/components/logout-button";
import { auditLogSamples, fixtures, leagues, roles, teams } from "@/lib/data";
import { permissions } from "@/lib/rbac";

export default function AdminPage() {
  const submitted = fixtures.filter((fixture) => fixture.status === "submitted");
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
        <div className="rounded-md bg-white p-4 shadow-sm"><Database className="text-emerald-700" /><p className="mt-3 font-mono text-2xl font-bold">{leagues.length}</p><p className="text-sm text-zinc-600">Leagues</p></div>
        <div className="rounded-md bg-white p-4 shadow-sm"><Activity className="text-emerald-700" /><p className="mt-3 font-mono text-2xl font-bold">{teams.length}</p><p className="text-sm text-zinc-600">Teams</p></div>
        <div className="rounded-md bg-white p-4 shadow-sm"><FilePenLine className="text-emerald-700" /><p className="mt-3 font-mono text-2xl font-bold">{fixtures.length}</p><p className="text-sm text-zinc-600">Fixtures</p></div>
        <div className="rounded-md bg-white p-4 shadow-sm"><CheckCircle2 className="text-emerald-700" /><p className="mt-3 font-mono text-2xl font-bold">{submitted.length}</p><p className="text-sm text-zinc-600">Pending approval</p></div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-[1fr_0.9fr]">
        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Result Approval Queue</h2>
          <div className="mt-3 grid gap-3">
            {submitted.map((fixture) => (
              <div key={fixture.id} className="rounded-md bg-zinc-50 p-3">
                <p className="font-bold">{fixture.homeScore}-{fixture.awayScore} submitted for fixture {fixture.id.toUpperCase()}</p>
                <p className="mt-1 text-sm text-zinc-600">Approving this result triggers standings recalculation and creates an audit log entry.</p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Approve</button>
                  <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">Quick Create</h2>
          <div className="mt-3 grid gap-2">
            <input className="h-12 rounded-md border border-zinc-200 px-3" placeholder="Record name" />
            <select className="h-12 rounded-md border border-zinc-200 px-3">{modules.slice(0, 6).map((module) => <option key={module}>{module}</option>)}</select>
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white"><Upload size={18} /> Save draft</button>
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
            {auditLogSamples.map((item) => (
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
