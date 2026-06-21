import Link from "next/link";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FilePenLine,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  Trophy,
  Upload,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";
import { LogoutButton } from "@/components/logout-button";
import { RichTextEditor } from "@/components/rich-text-editor";
import { can, requireAppUser, roleLabels, rolePermissions } from "@/lib/auth";
import { auditLogSamples, fixtures, leagues, roles, teams } from "@/lib/data";
import { getPrisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import {
  approveFixture,
  assignPlayerToTeam,
  createAdminUser,
  createFixture,
  createLeague,
  createNewsPost,
  createPlayer,
  createTeam,
  deleteLeague,
  deleteNewsPost,
  deletePlayer,
  deleteTeam,
  moveTeamToLeague,
  quickCreateRecord,
  rejectFixture,
  submitFixtureResult,
  updateLeague,
  updateNewsPost,
  updatePlayer,
  updateTeam,
  updateUserRole,
} from "./actions";

export const dynamic = "force-dynamic";

type AdminSection =
  | "overview"
  | "leagues"
  | "teams"
  | "players"
  | "assignments"
  | "fixtures"
  | "results"
  | "news"
  | "users"
  | "audit";

const inputClass = "h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";
const textareaClass = "min-h-32 rounded-md border border-zinc-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";
const buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800";

async function getAdminData() {
  try {
    const prisma = getPrisma();
    const [
      dbLeagues,
      dbTeams,
      dbPlayers,
      dbFixtures,
      dbAuditLogs,
      dbSeasons,
      dbAssignments,
      dbUsers,
      dbRoles,
      dbNewsPosts,
      dbVenues,
    ] = await Promise.all([
      prisma.league.findMany({ orderBy: { name: "asc" }, take: 24 }),
      prisma.team.findMany({ include: { league: true, teamStats: true }, orderBy: { name: "asc" }, take: 100 }),
      prisma.player.findMany({
        include: { teams: { include: { team: true } }, stats: true },
        orderBy: { fullName: "asc" },
        take: 100,
      }),
      prisma.fixture.findMany({
        include: { homeTeam: true, awayTeam: true, venue: true, league: true, match: true },
        orderBy: { kickoffAt: "desc" },
        take: 24,
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
      prisma.season.findMany({ orderBy: { year: "desc" }, take: 24 }),
      prisma.teamPlayer.findMany({
        include: { player: true, team: true },
        orderBy: { joinedAt: "desc" },
        take: 24,
      }),
      prisma.user.findMany({
        include: { role: true, team: true },
        orderBy: { email: "asc" },
        take: 50,
      }),
      prisma.role.findMany({ orderBy: { name: "asc" } }),
      prisma.newsPost.findMany({
        include: { league: true },
        orderBy: { publishedAt: "desc" },
        take: 12,
      }),
      prisma.venue.findMany({ orderBy: { name: "asc" }, take: 50 }),
    ]);

    return {
      dbLeagues,
      dbTeams,
      dbPlayers,
      dbFixtures,
      dbAuditLogs,
      dbSeasons,
      dbAssignments,
      dbUsers,
      dbRoles,
      dbNewsPosts,
      dbVenues,
      dbError: "",
    };
  } catch (error) {
    return {
      dbLeagues: [],
      dbTeams: [],
      dbPlayers: [],
      dbFixtures: [],
      dbAuditLogs: [],
      dbSeasons: [],
      dbAssignments: [],
      dbUsers: [],
      dbRoles: [],
      dbNewsPosts: [],
      dbVenues: [],
      dbError: error instanceof Error ? error.message : "Could not connect to the database.",
    };
  }
}

function sectionHref(section: AdminSection) {
  return `/admin?section=${section}`;
}

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-200 pb-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
      <h2 className="text-2xl font-black text-zinc-950">{title}</h2>
      {children ? <p className="max-w-3xl text-sm leading-6 text-zinc-600">{children}</p> : null}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">{children}</p>;
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-bold text-white">
      {children}
    </Link>
  );
}

function DangerButton({ children }: { children: React.ReactNode }) {
  return <button className="h-10 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700">{children}</button>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-100",
    SUBMITTED: "bg-amber-50 text-amber-800 ring-amber-100",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    REJECTED: "bg-red-50 text-red-700 ring-red-100",
    POSTPONED: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] ring-1 ${styles[status] ?? styles.POSTPONED}`}>
      {status.toLowerCase()}
    </span>
  );
}

function formatAdminDate(value: Date) {
  return new Intl.DateTimeFormat("en-GM", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    section?: string;
    mode?: string;
    editLeague?: string;
    editTeam?: string;
    editPlayer?: string;
    editPost?: string;
    q?: string;
    team?: string;
    division?: string;
  }>;
}) {
  const currentUser = await requireAppUser();
  const params = await searchParams;
  const status = params?.status;
  const {
    dbLeagues,
    dbTeams,
    dbPlayers,
    dbFixtures,
    dbAuditLogs,
    dbSeasons,
    dbAssignments,
    dbUsers,
    dbRoles,
    dbNewsPosts,
    dbVenues,
    dbError,
  } = await getAdminData();

  const submitted = fixtures.filter((fixture) => fixture.status === "submitted");
  const submittedDbFixtures = dbFixtures.filter((fixture) => fixture.status === "SUBMITTED");
  const canManageAll = can(currentUser, "all");
  const canManageLeagues = can(currentUser, "manage_leagues");
  const canManageFixtures = can(currentUser, "manage_fixtures");
  const canManageNews = can(currentUser, "manage_news");
  const canManageOwnTeam = can(currentUser, "manage_own_team");
  const canAssignPlayers = can(currentUser, "assign_players");
  const canSubmitResults = can(currentUser, "submit_results");

  const navItems = [
    { section: "overview" as const, label: "Overview", icon: LayoutDashboard, visible: true },
    { section: "leagues" as const, label: "Leagues", icon: Trophy, visible: canManageLeagues || canManageAll },
    { section: "teams" as const, label: "Teams", icon: ShieldCheck, visible: canManageOwnTeam || canManageAll },
    { section: "players" as const, label: "Players", icon: UsersRound, visible: canManageOwnTeam || canManageAll },
    { section: "assignments" as const, label: "Assignments", icon: ClipboardCheck, visible: canAssignPlayers || canManageLeagues || canManageAll },
    { section: "fixtures" as const, label: "Fixtures", icon: CalendarClock, visible: canManageFixtures || canManageAll },
    { section: "results" as const, label: "Results", icon: CheckCircle2, visible: canSubmitResults || canManageAll },
    { section: "news" as const, label: "News", icon: Newspaper, visible: canManageNews || canManageAll },
    { section: "users" as const, label: "Users & roles", icon: UserRoundCog, visible: canManageAll },
    { section: "audit" as const, label: "Audit logs", icon: Activity, visible: true },
  ].filter((item) => item.visible);

  const requestedSection = (params?.section ?? "overview") as AdminSection;
  const activeSection = navItems.some((item) => item.section === requestedSection) ? requestedSection : "overview";
  const mode = params?.mode ?? "list";
  const playerQuery = (params?.q ?? "").toLowerCase();
  const teamFilter = params?.team ?? "";
  const divisionFilter = params?.division ?? "";
  const selectedLeague = dbLeagues.find((league) => league.id === params?.editLeague);
  const selectedTeam = dbTeams.find((team) => team.id === params?.editTeam);
  const selectedPlayer = dbPlayers.find((player) => player.id === params?.editPlayer);
  const selectedPost = dbNewsPosts.find((post) => post.id === params?.editPost);
  const filteredPlayers = dbPlayers.filter((player) => {
    const matchesQuery = !playerQuery || player.fullName.toLowerCase().includes(playerQuery) || player.position.toLowerCase().includes(playerQuery);
    const matchesTeam = !teamFilter || player.teams.some((assignment) => assignment.teamId === teamFilter);
    const matchesDivision = !divisionFilter || player.teams.some((assignment) => assignment.team.division === divisionFilter);
    return matchesQuery && matchesTeam && matchesDivision;
  });
  const filteredTeams = dbTeams.filter((team) => !divisionFilter || team.division === divisionFilter);
  const divisions = Array.from(new Set(dbLeagues.map((league) => league.division).concat(dbTeams.map((team) => team.division)))).filter(Boolean).sort();

  const modules = [
    "Create/edit leagues",
    "Create/edit seasons",
    "Create/edit teams",
    "Create/edit players",
    "Create fixtures",
    "Assign players to teams",
  ];

  return (
    <div className="min-h-[calc(100vh-84px)] bg-[#f4f6f3]">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
          <div className="overflow-hidden rounded-md bg-[#07120d] text-white shadow-xl shadow-zinc-900/10">
            <div className="border-b border-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Control room</p>
              <h1 className="mt-2 text-2xl font-black">Admin Dashboard</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">{currentUser.email}</p>
            </div>

            <nav className="grid gap-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.section;
                return (
                  <Link
                    key={item.section}
                    href={sectionHref(item.section)}
                    className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
                      isActive ? "bg-white text-zinc-950" : "text-white/76 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-md bg-white/8 p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Current role</p>
                <p className="mt-2 font-bold">{roleLabels[currentUser.role.name]}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">GFF Leagues Operations</p>
              <p className="mt-1 text-sm text-zinc-600">Manage live football data with role-based permissions and audit logs.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#d91f2d] px-4 text-sm font-bold text-white">
                <ShieldCheck size={18} />
                {roleLabels[currentUser.role.name]}
              </div>
              <LogoutButton />
            </div>
          </div>

          {status ? (
            <section className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              {status}
            </section>
          ) : null}

          {dbError ? (
            <section className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
              <h2 className="font-bold">Database connection needs attention</h2>
              <p className="mt-1">
                The admin editor cannot load records until `DATABASE_URL` and `DIRECT_URL` are updated with the current Supabase database password.
              </p>
            </section>
          ) : null}

          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
            {activeSection === "overview" ? (
              <div className="grid gap-6">
                <SectionTitle eyebrow="Executive view" title="Operations Overview">
                  A quick read on records, approvals, and the active admin capability for your role.
                </SectionTitle>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Link href="/admin?section=leagues" className="rounded-md border border-zinc-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"><Database className="text-emerald-700" /><p className="mt-3 font-mono text-3xl font-black">{dbLeagues.length || leagues.length}</p><p className="text-sm text-zinc-600">Leagues</p></Link>
                  <Link href="/admin?section=teams" className="rounded-md border border-zinc-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"><Activity className="text-emerald-700" /><p className="mt-3 font-mono text-3xl font-black">{dbTeams.length || teams.length}</p><p className="text-sm text-zinc-600">Teams</p></Link>
                  <Link href="/admin?section=fixtures" className="rounded-md border border-zinc-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"><FilePenLine className="text-emerald-700" /><p className="mt-3 font-mono text-3xl font-black">{dbFixtures.length || fixtures.length}</p><p className="text-sm text-zinc-600">Fixtures</p></Link>
                  <Link href="/admin?section=results" className="rounded-md border border-zinc-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"><CheckCircle2 className="text-emerald-700" /><p className="mt-3 font-mono text-3xl font-black">{submittedDbFixtures.length || submitted.length}</p><p className="text-sm text-zinc-600">Pending approval</p></Link>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-md bg-zinc-50 p-4">
                    <h3 className="font-black text-zinc-950">Your Role</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{rolePermissions[currentUser.role.name][0]}</p>
                  </div>
                  {(canManageLeagues || canManageOwnTeam || canManageFixtures) ? (
                    <div className="rounded-md bg-zinc-50 p-4">
                      <h3 className="font-black text-zinc-950">Quick Create</h3>
                      <form action={quickCreateRecord} className="mt-3 grid gap-2">
                        <input name="recordName" className={inputClass} placeholder="Record name" />
                        <select name="recordType" className={inputClass}>{modules.map((module) => <option key={module}>{module}</option>)}</select>
                        <button className={buttonClass}><Upload size={18} /> Save draft</button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeSection === "leagues" ? (
              <div className="grid gap-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <SectionTitle eyebrow="Competition setup" title={mode === "new" || selectedLeague ? "League Editor" : "Leagues & Divisions"}>
                    Manage leagues as compact records with add, edit, delete, and image controls.
                  </SectionTitle>
                  <ActionLink href="/admin?section=leagues&mode=new">Add league</ActionLink>
                </div>

                {mode === "new" || selectedLeague ? (
                  <form action={selectedLeague ? updateLeague : createLeague} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                    {selectedLeague ? <input type="hidden" name="id" value={selectedLeague.id} /> : null}
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="name" defaultValue={selectedLeague?.name} className={inputClass} placeholder="League name" />
                      <input name="division" defaultValue={selectedLeague?.division} className={inputClass} placeholder="Division" />
                      <input name="description" defaultValue={selectedLeague?.description} className={`${inputClass} md:col-span-2`} placeholder="Description" />
                      <label className="flex items-center gap-2 text-sm font-bold">
                        <input name="isActive" type="checkbox" defaultChecked={selectedLeague?.isActive ?? true} />
                        Active
                      </label>
                    </div>
                    <ImageUploadField name="logoUrl" label="League image" defaultValue={selectedLeague?.logoUrl ?? "/gff-logo.jpg"} help="Upload a league logo, badge, or competition image." />
                    <div className="flex justify-end gap-2">
                      <Link href="/admin?section=leagues" className="inline-flex h-11 items-center rounded-md border border-zinc-200 px-4 text-sm font-bold">Cancel</Link>
                      <button className={buttonClass}>{selectedLeague ? "Save league" : "Create league"}</button>
                    </div>
                  </form>
                ) : (
                  <div className="overflow-hidden rounded-md border border-zinc-200">
                    {dbLeagues.map((league) => (
                      <div key={league.id} className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-[1fr_1fr_auto] md:items-center">
                        <div>
                          <p className="font-black text-zinc-950">{league.name}</p>
                          <p className="mt-1 text-sm text-zinc-600">{league.description}</p>
                        </div>
                        <p className="text-sm font-bold text-emerald-700">{league.division}</p>
                        <div className="flex gap-2">
                          <Link href={`/admin?section=leagues&editLeague=${league.id}`} className="h-10 rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold">Edit</Link>
                          <form action={deleteLeague}><input type="hidden" name="id" value={league.id} /><DangerButton>Delete</DangerButton></form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  {dbLeagues.length === 0 ? <EmptyState>No leagues found.</EmptyState> : null}
              </div>
            ) : null}

            {activeSection === "teams" ? (
              <div className="grid gap-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <SectionTitle eyebrow="Club records" title={mode === "new" || selectedTeam ? "Team Editor" : "Teams"}>
                    List teams by name, filter by division, and open an editor only when needed.
                  </SectionTitle>
                  <ActionLink href="/admin?section=teams&mode=new">Add team</ActionLink>
                </div>

                {mode === "new" || selectedTeam ? (
                  <form action={selectedTeam ? updateTeam : createTeam} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                    {selectedTeam ? <input type="hidden" name="id" value={selectedTeam.id} /> : null}
                    {!selectedTeam ? (
                      <select name="leagueId" className={inputClass} required>
                        <option value="">Choose league/division</option>
                        {dbLeagues.map((league) => <option key={league.id} value={league.id}>{league.name} - {league.division}</option>)}
                      </select>
                    ) : null}
                      <div className="grid gap-3 md:grid-cols-2">
                        <input name="name" defaultValue={selectedTeam?.name} className={inputClass} placeholder="Team name" />
                        <input name="division" defaultValue={selectedTeam?.division} className={inputClass} placeholder="Division" />
                        <input name="homeGround" defaultValue={selectedTeam?.homeGround} className={inputClass} placeholder="Homefield" />
                        <input name="city" defaultValue={selectedTeam?.city ?? ""} className={inputClass} placeholder="City/town" />
                        <input name="coach" defaultValue={selectedTeam?.coach} className={`${inputClass} md:col-span-2`} placeholder="Coach" />
                      </div>
                    <ImageUploadField name="logoUrl" label="Team logo" defaultValue={selectedTeam?.logoUrl ?? "/gff-logo.jpg"} help="Upload a square club logo or paste an image URL." aspect="square" />
                    <div className="flex justify-end gap-2">
                      <Link href="/admin?section=teams" className="inline-flex h-11 items-center rounded-md border border-zinc-200 px-4 text-sm font-bold">Cancel</Link>
                      <button className={buttonClass}>{selectedTeam ? "Save team" : "Create team"}</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <form className="grid gap-2 rounded-md bg-zinc-50 p-3 md:grid-cols-[1fr_auto]">
                      <input type="hidden" name="section" value="teams" />
                      <select name="division" defaultValue={divisionFilter} className={inputClass}>
                        <option value="">All divisions</option>
                        {divisions.map((division) => <option key={division} value={division}>{division}</option>)}
                      </select>
                      <button className={buttonClass}>Filter</button>
                    </form>
                    <div className="overflow-hidden rounded-md border border-zinc-200">
                      {filteredTeams.map((team) => (
                        <div key={team.id} className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-[1fr_1fr_auto] md:items-center">
                          <div>
                            <p className="font-black text-zinc-950">{team.name}</p>
                            <p className="mt-1 text-sm text-zinc-600">{team.homeGround} {team.city ? `- ${team.city}` : ""}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-700">{team.division}</p>
                          <div className="flex gap-2">
                            <Link href={`/admin?section=teams&editTeam=${team.id}`} className="h-10 rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold">Edit</Link>
                            <form action={deleteTeam}><input type="hidden" name="id" value={team.id} /><DangerButton>Delete</DangerButton></form>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                  {dbTeams.length === 0 ? <EmptyState>No teams found.</EmptyState> : null}
              </div>
            ) : null}

            {activeSection === "players" ? (
              <div className="grid gap-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <SectionTitle eyebrow="Squad management" title={mode === "new" || selectedPlayer ? "Player Editor" : "Players"}>
                    Search players by name, team, or division, then edit the record you need.
                  </SectionTitle>
                  <ActionLink href="/admin?section=players&mode=new">Add player</ActionLink>
                </div>

                {mode === "new" || selectedPlayer ? (
                  <form action={selectedPlayer ? updatePlayer : createPlayer} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                    {selectedPlayer ? <input type="hidden" name="id" value={selectedPlayer.id} /> : null}
                    {!selectedPlayer ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <select name="teamId" className={inputClass}>
                          <option value="">Assign to team</option>
                          {dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                        <select name="seasonId" className={inputClass}>
                          <option value="">Season</option>
                          {dbSeasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
                        </select>
                      </div>
                    ) : null}
                      <div className="grid gap-3 md:grid-cols-2">
                        <input name="fullName" defaultValue={selectedPlayer?.fullName} className={inputClass} placeholder="Full name" />
                        <input name="position" defaultValue={selectedPlayer?.position} className={inputClass} placeholder="Position" />
                        <input name="hometown" defaultValue={selectedPlayer?.hometown ?? ""} className={inputClass} placeholder="Hometown" />
                        <input name="jerseyNumber" type="number" defaultValue={selectedPlayer?.jerseyNumber ?? 0} className={inputClass} placeholder="Jersey number" />
                        <input name="dateOfBirth" type="date" defaultValue={selectedPlayer?.dateOfBirth.toISOString().slice(0, 10) ?? "2000-01-01"} className={inputClass} />
                      </div>
                    <ImageUploadField name="photoUrl" label="Player photo" defaultValue={selectedPlayer?.photoUrl ?? "/gff-logo.jpg"} help="Upload a player headshot or paste an image URL." aspect="portrait" />
                    <div className="flex justify-end gap-2">
                      <Link href="/admin?section=players" className="inline-flex h-11 items-center rounded-md border border-zinc-200 px-4 text-sm font-bold">Cancel</Link>
                      <button className={buttonClass}>{selectedPlayer ? "Save player" : "Create player"}</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <form className="grid gap-2 rounded-md bg-zinc-50 p-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                      <input type="hidden" name="section" value="players" />
                      <input name="q" defaultValue={params?.q ?? ""} className={inputClass} placeholder="Search name or position" />
                      <select name="team" defaultValue={teamFilter} className={inputClass}><option value="">All teams</option>{dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                      <select name="division" defaultValue={divisionFilter} className={inputClass}><option value="">All divisions</option>{divisions.map((division) => <option key={division} value={division}>{division}</option>)}</select>
                      <button className={buttonClass}>Search</button>
                    </form>
                    <div className="overflow-hidden rounded-md border border-zinc-200">
                      {filteredPlayers.map((player) => (
                        <div key={player.id} className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-[1fr_1fr_auto] md:items-center">
                          <div>
                            <p className="font-black text-zinc-950">{player.fullName}</p>
                            <p className="mt-1 text-sm text-zinc-600">{player.position} {player.hometown ? `- ${player.hometown}` : ""}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-700">{player.teams[0]?.team.name ?? "Unassigned"}</p>
                          <div className="flex gap-2">
                            <Link href={`/admin?section=players&editPlayer=${player.id}`} className="h-10 rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold">Edit</Link>
                            <form action={deletePlayer}><input type="hidden" name="id" value={player.id} /><DangerButton>Delete</DangerButton></form>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredPlayers.length === 0 ? <EmptyState>No players match the search.</EmptyState> : null}
                  </>
                )}
              </div>
            ) : null}

            {activeSection === "assignments" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Registrations" title="Player & Division Assignments">
                  Add players to squads and move teams into the correct league or division.
                </SectionTitle>
                <div className="grid gap-4 xl:grid-cols-2">
                  {(canAssignPlayers || canManageAll) ? (
                    <form action={assignPlayerToTeam} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                      <h3 className="font-black text-zinc-950">Add player to team</h3>
                      <select name="playerId" className={inputClass} required>
                        <option value="">Choose player</option>
                        {dbPlayers.map((player) => <option key={player.id} value={player.id}>{player.fullName}</option>)}
                      </select>
                      <select name="teamId" className={inputClass} required>
                        <option value="">Choose team</option>
                        {dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                      <select name="seasonId" className={inputClass} required>
                        <option value="">Choose season</option>
                        {dbSeasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
                      </select>
                      <button className={buttonClass}>Assign player</button>
                    </form>
                  ) : null}
                  {(canManageLeagues || canManageAll) ? (
                    <form action={moveTeamToLeague} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                      <h3 className="font-black text-zinc-950">Move team to division</h3>
                      <select name="teamId" className={inputClass} required>
                        <option value="">Choose team</option>
                        {dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                      <select name="leagueId" className={inputClass} required>
                        <option value="">Choose league/division</option>
                        {dbLeagues.map((league) => <option key={league.id} value={league.id}>{league.name} - {league.division}</option>)}
                      </select>
                      <button className={buttonClass}>Move team</button>
                    </form>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  {dbAssignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-md border border-zinc-100 p-3 text-sm text-zinc-700">
                      <span className="font-semibold text-zinc-950">{assignment.player.fullName}</span> is registered with {assignment.team.name}
                    </div>
                  ))}
                  {dbAssignments.length === 0 ? <EmptyState>No player-team assignments yet.</EmptyState> : null}
                </div>
              </div>
            ) : null}

            {activeSection === "fixtures" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Match operations" title="Fixtures">
                  Create official fixtures with league, season, teams, venue, and kickoff time.
                </SectionTitle>
                <div className="overflow-hidden rounded-md border border-zinc-200">
                  <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                    <h3 className="font-black text-zinc-950">Existing fixtures</h3>
                    <p className="mt-1 text-sm text-zinc-600">All fixtures already in the system, including submitted and approved results.</p>
                  </div>
                  {dbFixtures.map((fixture) => (
                    <div key={fixture.id} className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center">
                      <div>
                        <p className="font-black text-zinc-950">{fixture.homeTeam.name} vs {fixture.awayTeam.name}</p>
                        <p className="mt-1 text-sm text-zinc-600">{fixture.league.name} · {fixture.venue.name} · {formatAdminDate(fixture.kickoffAt)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={fixture.status} />
                        {fixture.homeScore !== null && fixture.awayScore !== null ? (
                          <span className="font-mono text-sm font-black text-zinc-950">{fixture.homeScore}-{fixture.awayScore}</span>
                        ) : null}
                      </div>
                      <Link href="/admin?section=results" className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-bold">
                        Manage result
                      </Link>
                    </div>
                  ))}
                  {dbFixtures.length === 0 ? <EmptyState>No fixtures have been created yet.</EmptyState> : null}
                </div>
                <form action={createFixture} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                  <h3 className="font-black text-zinc-950">Create new fixture</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select name="leagueId" className={inputClass} required><option value="">League</option>{dbLeagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}</select>
                    <select name="seasonId" className={inputClass} required><option value="">Season</option>{dbSeasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select>
                    <select name="homeTeamId" className={inputClass} required><option value="">Home team</option>{dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                    <select name="awayTeamId" className={inputClass} required><option value="">Away team</option>{dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                    <select name="venueId" className={inputClass} required><option value="">Venue</option>{dbVenues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select>
                    <input name="kickoffAt" type="datetime-local" className={inputClass} required />
                  </div>
                  <button className={`${buttonClass} justify-self-end`}>Create fixture</button>
                </form>
              </div>
            ) : null}

            {activeSection === "results" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Result control" title="Results & Approvals">
                  Enter scores, match events, team stats, and player stats for official reporting.
                </SectionTitle>
                <div className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <div>
                    <h3 className="font-black text-zinc-950">Pending approval queue</h3>
                    <p className="mt-1 text-sm text-zinc-700">Submitted results waiting for Super Admin approval appear here first.</p>
                  </div>
                  {submittedDbFixtures.map((fixture) => (
                    <div key={fixture.id} className="rounded-md bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-bold">{fixture.homeTeam.name} {fixture.homeScore}-{fixture.awayScore} {fixture.awayTeam.name}</p>
                          <p className="mt-1 text-sm text-zinc-600">{fixture.league.name} · {fixture.venue.name} · {formatAdminDate(fixture.kickoffAt)}</p>
                        </div>
                        <StatusBadge status={fixture.status} />
                      </div>
                      {canManageAll ? (
                        <div className="mt-3 flex gap-2">
                          <form action={approveFixture}><input type="hidden" name="id" value={fixture.id} /><button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Approve</button></form>
                          <form action={rejectFixture}><input type="hidden" name="id" value={fixture.id} /><button className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-bold">Reject</button></form>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {submittedDbFixtures.length === 0 ? <EmptyState>No submitted results are waiting right now.</EmptyState> : null}
                </div>
                {(canSubmitResults || canManageAll) ? (
                  <form action={submitFixtureResult} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                    <h3 className="font-black text-zinc-950">Submit or update result</h3>
                    <select name="fixtureId" className={inputClass} required>
                      <option value="">Fixture</option>
                      {dbFixtures.map((fixture) => <option key={fixture.id} value={fixture.id}>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input name="homeScore" type="number" min="0" className={inputClass} placeholder="Home score" required />
                      <input name="awayScore" type="number" min="0" className={inputClass} placeholder="Away score" required />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="homeCleanSheet" type="number" min="0" className={inputClass} placeholder="Home clean sheets season total" />
                      <input name="awayCleanSheet" type="number" min="0" className={inputClass} placeholder="Away clean sheets season total" />
                      <input name="homeForm" className={inputClass} placeholder="Home form e.g. W-D-L-W" />
                      <input name="awayForm" className={inputClass} placeholder="Away form e.g. L-W-D-W" />
                    </div>
                    <textarea name="notes" className={textareaClass} placeholder="Match notes, goal scorers, cards, substitutions" />

                    <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-3">
                      <h3 className="font-black text-zinc-950">Match events</h3>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="grid gap-2 md:grid-cols-[80px_1fr_1fr_1fr_1.4fr]">
                          <input name={`eventMinute_${index}`} type="number" min="0" className={inputClass} placeholder="Min" />
                          <select name={`eventType_${index}`} className={inputClass}>
                            <option value="">Event</option>
                            <option value="GOAL">Goal</option>
                            <option value="ASSIST">Assist</option>
                            <option value="YELLOW_CARD">Yellow card</option>
                            <option value="RED_CARD">Red card</option>
                            <option value="SUBSTITUTION">Substitution</option>
                            <option value="OWN_GOAL">Own goal</option>
                          </select>
                          <select name={`eventTeamId_${index}`} className={inputClass}><option value="">Team</option>{dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                          <select name={`eventPlayerId_${index}`} className={inputClass}><option value="">Player</option>{dbPlayers.map((player) => <option key={player.id} value={player.id}>{player.fullName}</option>)}</select>
                          <input name={`eventNote_${index}`} className={inputClass} placeholder="Note" />
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-3">
                      <h3 className="font-black text-zinc-950">Player stat updates</h3>
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="grid gap-2 md:grid-cols-[1.5fr_repeat(5,90px)]">
                          <select name={`statPlayerId_${index}`} className={inputClass}><option value="">Player</option>{dbPlayers.map((player) => <option key={player.id} value={player.id}>{player.fullName}</option>)}</select>
                          <input name={`statAppearances_${index}`} type="number" min="0" className={inputClass} placeholder="Apps" />
                          <input name={`statGoals_${index}`} type="number" min="0" className={inputClass} placeholder="Goals" />
                          <input name={`statAssists_${index}`} type="number" min="0" className={inputClass} placeholder="Ast" />
                          <input name={`statYellowCards_${index}`} type="number" min="0" className={inputClass} placeholder="YC" />
                          <input name={`statRedCards_${index}`} type="number" min="0" className={inputClass} placeholder="RC" />
                        </div>
                      ))}
                    </div>
                    <button className={`${buttonClass} justify-self-end`}>Submit for approval</button>
                  </form>
                ) : null}
              </div>
            ) : null}

            {activeSection === "news" ? (
              <div className="grid gap-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <SectionTitle eyebrow="Publishing desk" title={mode === "new" || selectedPost ? "Article Editor" : "Recent News"}>
                    Manage news like a CMS: recent articles first, with edit, delete, and a rich text editor.
                  </SectionTitle>
                  <ActionLink href="/admin?section=news&mode=new">Create new article</ActionLink>
                </div>

                {mode === "new" || selectedPost ? (
                  <form action={selectedPost ? updateNewsPost : createNewsPost} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                    {selectedPost ? <input type="hidden" name="id" value={selectedPost.id} /> : null}
                    <div className="rounded-md border border-zinc-200 bg-white p-3">
                      <input name="title" defaultValue={selectedPost?.title} className="h-12 w-full text-2xl font-black outline-none" placeholder="Add title" />
                    </div>
                    <input name="excerpt" defaultValue={selectedPost?.excerpt} className={inputClass} placeholder="Short excerpt" />
                    <select name="leagueId" defaultValue={selectedPost?.leagueId ?? ""} className={inputClass}>
                      <option value="">General federation news</option>
                      {dbLeagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}
                    </select>
                    <ImageUploadField name="coverImageUrl" label="Cover image" defaultValue={selectedPost?.coverImageUrl ?? "/gff-logo.jpg"} help="Upload a story cover image or paste an image URL." />
                    <RichTextEditor name="body" defaultValue={selectedPost?.body ?? ""} />
                    <div className="flex justify-end gap-2">
                      <Link href="/admin?section=news" className="inline-flex h-11 items-center rounded-md border border-zinc-200 px-4 text-sm font-bold">Cancel</Link>
                      <button className={buttonClass}><Newspaper size={18} /> {selectedPost ? "Update article" : "Publish news"}</button>
                    </div>
                  </form>
                ) : (
                  <div className="overflow-hidden rounded-md border border-zinc-200">
                    {dbNewsPosts.map((post) => (
                      <div key={post.id} className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <p className="font-black text-zinc-950">{post.title}</p>
                          <p className="mt-1 text-sm text-zinc-600">{post.league?.name ?? "General"} - {post.excerpt}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/news/${post.slug}`} className="h-10 rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold">View</Link>
                          <Link href={`/admin?section=news&editPost=${post.id}`} className="h-10 rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold">Edit</Link>
                          <form action={deleteNewsPost}><input type="hidden" name="id" value={post.id} /><DangerButton>Delete</DangerButton></form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                    {dbNewsPosts.length === 0 ? <EmptyState>No league news has been published yet.</EmptyState> : null}
              </div>
            ) : null}

            {activeSection === "users" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Access control" title="Users & Roles">
                  Create Supabase login users, assign roles, and connect team admins to a club.
                </SectionTitle>
                <form action={createAdminUser} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                  <h3 className="font-black text-zinc-950">Add new user</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="name" className={inputClass} placeholder="Full name" />
                    <input name="email" type="email" className={inputClass} placeholder="Email" required />
                    <input name="password" type="password" className={inputClass} placeholder="Temporary password" required />
                    <select name="roleId" className={inputClass} required>
                      <option value="">Choose role</option>
                      {dbRoles.map((role) => <option key={role.id} value={role.id}>{roleLabels[role.name]}</option>)}
                    </select>
                    <select name="teamId" className={`${inputClass} md:col-span-2`}>
                      <option value="">No assigned team</option>
                      {dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                  </div>
                  <p className="text-xs leading-5 text-zinc-500">Creates a Supabase Auth login and attaches the selected GFF Leagues role.</p>
                  <button className={`${buttonClass} justify-self-end`}>Create user</button>
                </form>
                <div className="grid gap-3">
                  {dbUsers.map((user) => (
                    <form key={user.id} action={updateUserRole} className="grid gap-2 rounded-md bg-zinc-50 p-3 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
                      <input type="hidden" name="userId" value={user.id} />
                      <p className="self-center text-sm font-semibold text-zinc-950">{user.email}</p>
                      <select name="roleId" defaultValue={user.roleId} className={inputClass}>{dbRoles.map((role) => <option key={role.id} value={role.id}>{roleLabels[role.name]}</option>)}</select>
                      <select name="teamId" defaultValue={user.teamId ?? ""} className={inputClass}><option value="">No team</option>{dbTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                      <button className={buttonClass}>Save role</button>
                    </form>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "audit" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Governance" title="Audit Logs">
                  Recent important admin actions are recorded here for accountability.
                </SectionTitle>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="grid gap-3">
                    {(dbAuditLogs.length ? dbAuditLogs : []).map((log) => (
                      <div key={log.id} className="rounded-md border border-zinc-100 p-3 text-sm text-zinc-700">
                        <p className="font-bold text-zinc-950">{log.action} {log.entity}</p>
                        <p className="mt-1 text-xs text-zinc-500">{log.createdAt.toLocaleString("en-GM")}</p>
                      </div>
                    ))}
                    {dbAuditLogs.length === 0 ? auditLogSamples.map((item, index) => <div key={`${item}-${index}`} className="rounded-md border border-zinc-100 p-3 text-sm text-zinc-700">{item}</div>) : null}
                  </div>
                  <div className="grid content-start gap-3 rounded-md bg-[#07120d] p-5 text-white">
                    <h3 className="text-lg font-black">Role rulebook</h3>
                    {roles.map((role) => (
                      <div key={role} className="rounded-md bg-white/8 p-3">
                        <p className="font-bold">{role}</p>
                        <p className="mt-1 text-sm leading-6 text-white/70">{permissions[role][0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
