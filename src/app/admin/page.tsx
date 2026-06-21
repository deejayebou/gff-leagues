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
import { can, requireAppUser, roleLabels, rolePermissions } from "@/lib/auth";
import { auditLogSamples, fixtures, leagues, roles, teams } from "@/lib/data";
import { getPrisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import {
  approveFixture,
  assignPlayerToTeam,
  createFixture,
  createNewsPost,
  moveTeamToLeague,
  quickCreateRecord,
  rejectFixture,
  submitFixtureResult,
  updateLeague,
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
      prisma.team.findMany({ include: { league: true }, orderBy: { name: "asc" }, take: 24 }),
      prisma.player.findMany({ orderBy: { fullName: "asc" }, take: 24 }),
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; section?: string }>;
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
                  <div className="rounded-md border border-zinc-200 p-4"><Database className="text-emerald-700" /><p className="mt-3 font-mono text-3xl font-black">{dbLeagues.length || leagues.length}</p><p className="text-sm text-zinc-600">Leagues</p></div>
                  <div className="rounded-md border border-zinc-200 p-4"><Activity className="text-emerald-700" /><p className="mt-3 font-mono text-3xl font-black">{dbTeams.length || teams.length}</p><p className="text-sm text-zinc-600">Teams</p></div>
                  <div className="rounded-md border border-zinc-200 p-4"><FilePenLine className="text-emerald-700" /><p className="mt-3 font-mono text-3xl font-black">{dbFixtures.length || fixtures.length}</p><p className="text-sm text-zinc-600">Fixtures</p></div>
                  <div className="rounded-md border border-zinc-200 p-4"><CheckCircle2 className="text-emerald-700" /><p className="mt-3 font-mono text-3xl font-black">{submittedDbFixtures.length || submitted.length}</p><p className="text-sm text-zinc-600">Pending approval</p></div>
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
                <SectionTitle eyebrow="Competition setup" title="Leagues & Divisions">
                  Edit league names, divisions, descriptions, status, and official images.
                </SectionTitle>
                <div className="grid gap-4">
                  {dbLeagues.map((league) => (
                    <form key={league.id} action={updateLeague} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                      <input type="hidden" name="id" value={league.id} />
                      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr_auto]">
                        <input name="name" defaultValue={league.name} className={inputClass} />
                        <input name="division" defaultValue={league.division} className={inputClass} />
                        <input name="description" defaultValue={league.description} className={inputClass} />
                        <label className="flex items-center gap-2 text-sm font-bold">
                          <input name="isActive" type="checkbox" defaultChecked={league.isActive} />
                          Active
                        </label>
                      </div>
                      <ImageUploadField name="logoUrl" label="League image" defaultValue={league.logoUrl ?? "/gff-logo.jpg"} help="Upload a league logo, badge, or competition image." />
                      <button className={`${buttonClass} justify-self-end`}>Save league</button>
                    </form>
                  ))}
                  {dbLeagues.length === 0 ? <EmptyState>No leagues found.</EmptyState> : null}
                </div>
              </div>
            ) : null}

            {activeSection === "teams" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Club records" title="Teams">
                  Update team profile details and upload official team logos.
                </SectionTitle>
                <div className="grid gap-4">
                  {dbTeams.map((team) => (
                    <form key={team.id} action={updateTeam} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                      <input type="hidden" name="id" value={team.id} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <input name="name" defaultValue={team.name} className={inputClass} />
                        <input name="division" defaultValue={team.division} className={inputClass} />
                        <input name="homeGround" defaultValue={team.homeGround} className={inputClass} />
                        <input name="coach" defaultValue={team.coach} className={inputClass} />
                      </div>
                      <ImageUploadField name="logoUrl" label="Team logo" defaultValue={team.logoUrl ?? "/gff-logo.jpg"} help="Upload a square club logo or paste an image URL." aspect="square" />
                      <button className={`${buttonClass} justify-self-end`}>Save team</button>
                    </form>
                  ))}
                  {dbTeams.length === 0 ? <EmptyState>No teams found.</EmptyState> : null}
                </div>
              </div>
            ) : null}

            {activeSection === "players" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Squad management" title="Players">
                  Maintain player profiles, squad details, jersey numbers, and player photos.
                </SectionTitle>
                <div className="grid gap-4">
                  {dbPlayers.map((player) => (
                    <form key={player.id} action={updatePlayer} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                      <input type="hidden" name="id" value={player.id} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <input name="fullName" defaultValue={player.fullName} className={inputClass} />
                        <input name="position" defaultValue={player.position} className={inputClass} />
                        <input name="jerseyNumber" type="number" defaultValue={player.jerseyNumber} className={inputClass} />
                        <input name="dateOfBirth" type="date" defaultValue={player.dateOfBirth.toISOString().slice(0, 10)} className={inputClass} />
                      </div>
                      <ImageUploadField name="photoUrl" label="Player photo" defaultValue={player.photoUrl ?? "/gff-logo.jpg"} help="Upload a player headshot or paste an image URL." aspect="portrait" />
                      <button className={`${buttonClass} justify-self-end`}>Save player</button>
                    </form>
                  ))}
                  {dbPlayers.length === 0 ? <EmptyState>No players found.</EmptyState> : null}
                </div>
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
                <form action={createFixture} className="grid gap-3 rounded-md bg-zinc-50 p-4">
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
                  Match officials submit scores and match notes. Super Admins approve official results.
                </SectionTitle>
                {(canSubmitResults || canManageAll) ? (
                  <form action={submitFixtureResult} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                    <select name="fixtureId" className={inputClass} required>
                      <option value="">Fixture</option>
                      {dbFixtures.map((fixture) => <option key={fixture.id} value={fixture.id}>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input name="homeScore" type="number" min="0" className={inputClass} placeholder="Home score" required />
                      <input name="awayScore" type="number" min="0" className={inputClass} placeholder="Away score" required />
                    </div>
                    <textarea name="notes" className={textareaClass} placeholder="Match notes, goal scorers, cards, substitutions" />
                    <button className={`${buttonClass} justify-self-end`}>Submit for approval</button>
                  </form>
                ) : null}
                <div className="grid gap-3">
                  {submittedDbFixtures.map((fixture) => (
                    <div key={fixture.id} className="rounded-md bg-zinc-50 p-4">
                      <p className="font-bold">{fixture.homeTeam.name} {fixture.homeScore}-{fixture.awayScore} {fixture.awayTeam.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">Approving this result triggers standings recalculation and creates an audit log entry.</p>
                      {canManageAll ? (
                        <div className="mt-3 flex gap-2">
                          <form action={approveFixture}><input type="hidden" name="id" value={fixture.id} /><button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Approve</button></form>
                          <form action={rejectFixture}><input type="hidden" name="id" value={fixture.id} /><button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold">Reject</button></form>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {submittedDbFixtures.length === 0 ? <EmptyState>No submitted results are waiting right now.</EmptyState> : null}
                </div>
              </div>
            ) : null}

            {activeSection === "news" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Publishing desk" title="League News Editor">
                  Create federation and league news with cover images, a focused editor, and live post history.
                </SectionTitle>
                <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <form action={createNewsPost} className="grid gap-3 rounded-md bg-zinc-50 p-4">
                    <div className="rounded-md border border-zinc-200 bg-white p-3">
                      <input name="title" className="h-12 w-full text-2xl font-black outline-none" placeholder="Add title" />
                    </div>
                    <input name="excerpt" className={inputClass} placeholder="Short excerpt" />
                    <select name="leagueId" className={inputClass}>
                      <option value="">General federation news</option>
                      {dbLeagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}
                    </select>
                    <ImageUploadField name="coverImageUrl" label="Cover image" defaultValue="/gff-logo.jpg" help="Upload a story cover image or paste an image URL." />
                    <textarea name="body" className="min-h-72 rounded-md border border-zinc-200 bg-white p-4 text-base leading-7 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" placeholder="Write the full story..." />
                    <button className={`${buttonClass} justify-self-end`}><Newspaper size={18} /> Publish news</button>
                  </form>
                  <div className="grid content-start gap-3 rounded-md bg-zinc-50 p-4">
                    <h3 className="font-black text-zinc-950">Recent posts</h3>
                    {dbNewsPosts.map((post) => (
                      <Link key={post.id} href={`/news/${post.slug}`} className="rounded-md border border-zinc-200 bg-white p-3 text-sm hover:border-emerald-700">
                        <p className="font-bold text-zinc-950">{post.title}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#d91f2d]">{post.league?.name ?? "General"}</p>
                        <p className="mt-2 leading-5 text-zinc-600">{post.excerpt}</p>
                      </Link>
                    ))}
                    {dbNewsPosts.length === 0 ? <EmptyState>No league news has been published yet.</EmptyState> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "users" ? (
              <div className="grid gap-5">
                <SectionTitle eyebrow="Access control" title="Users & Roles">
                  Assign admin roles and connect team admins to the club they are allowed to manage.
                </SectionTitle>
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
