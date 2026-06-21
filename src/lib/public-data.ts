import { MatchEventType, MatchStatus } from "@prisma/client";
import {
  fixtures as sampleFixtures,
  leagues as sampleLeagues,
  matchEvents as sampleMatchEvents,
  players as samplePlayers,
  teams as sampleTeams,
} from "@/lib/data";
import { getPrisma } from "@/lib/prisma";

export type PublicLeague = {
  id: string;
  name: string;
  slug: string;
  division: string;
  description: string;
  season: string;
  teamsCount: number;
  logoUrl?: string | null;
};

export type PublicTeam = {
  id: string;
  name: string;
  slug: string;
  division: string;
  leagueSlug: string;
  leagueName: string;
  logoUrl: string;
  homeGround: string;
  city?: string | null;
  coach: string;
  founded?: number | null;
};

export type PublicPlayerStats = {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

export type PublicPlayer = {
  id: string;
  fullName: string;
  slug: string;
  dateOfBirth: string;
  position: string;
  hometown?: string | null;
  jerseyNumber: number;
  teamSlug?: string;
  teamName?: string;
  division?: string;
  photoUrl: string;
  stats: PublicPlayerStats;
};

export type PublicMatchEvent = {
  id: string;
  minute: number;
  teamSlug: string;
  teamName: string;
  playerSlug?: string;
  playerName: string;
  type: string;
  note?: string | null;
};

export type PublicFixture = {
  id: string;
  leagueSlug: string;
  leagueName: string;
  homeTeamSlug: string;
  homeTeamName: string;
  awayTeamSlug: string;
  awayTeamName: string;
  kickoffAt: string;
  venue: string;
  status: "scheduled" | "submitted" | "approved" | "rejected" | "postponed";
  homeScore?: number;
  awayScore?: number;
  events: PublicMatchEvent[];
};

export type PublicStandingRow = {
  team: {
    slug: string;
    name: string;
  };
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type PublicLeagueDetail = PublicLeague & {
  teams: PublicTeam[];
  fixtures: PublicFixture[];
  standings: PublicStandingRow[];
  topScorers: PublicPlayer[];
};

export type PublicTeamDetail = PublicTeam & {
  squad: PublicPlayer[];
  fixtures: PublicFixture[];
  played: number;
  goalsFor: number;
};

export type PublicHomeData = {
  leagues: PublicLeague[];
  teams: PublicTeam[];
  players: PublicPlayer[];
  upcoming: PublicFixture[];
  results: PublicFixture[];
  featured?: PublicFixture;
  firstStandings: PublicStandingRow[];
};

type DbFixture = {
  id: string;
  kickoffAt: Date;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  league: { slug: string; name: string };
  homeTeam: { slug: string; name: string };
  awayTeam: { slug: string; name: string };
  venue: { name: string };
  events?: {
    id: string;
    minute: number;
    type: MatchEventType;
    note: string | null;
    teamId: string;
    player?: { slug: string; fullName: string } | null;
  }[];
};

type DbTeam = {
  id: string;
  name: string;
  slug: string;
  division: string;
  logoUrl: string | null;
  homeGround: string;
  city?: string | null;
  coach: string;
  league: { slug: string; name: string };
};

type DbPlayer = {
  id: string;
  fullName: string;
  slug: string;
  photoUrl: string | null;
  dateOfBirth: Date;
  position: string;
  hometown?: string | null;
  jerseyNumber: number;
  teams?: { leftAt: Date | null; team: DbTeam }[];
  stats?: PublicPlayerStats[];
};

const DEFAULT_IMAGE = "/gff-logo.jpg";

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GM", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function age(dateOfBirth: string | Date) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  return years;
}

function safeImage(value?: string | null) {
  return value?.trim() || DEFAULT_IMAGE;
}

function statusFromDb(status: MatchStatus): PublicFixture["status"] {
  return status.toLowerCase() as PublicFixture["status"];
}

function eventTypeLabel(type: MatchEventType | string) {
  return type
    .toString()
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function emptyStats(): PublicPlayerStats {
  return { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
}

function combineStats(stats: PublicPlayerStats[] = []) {
  return stats.reduce(
    (total, stat) => ({
      appearances: total.appearances + stat.appearances,
      goals: total.goals + stat.goals,
      assists: total.assists + stat.assists,
      yellowCards: total.yellowCards + stat.yellowCards,
      redCards: total.redCards + stat.redCards,
    }),
    emptyStats(),
  );
}

function mapDbTeam(team: DbTeam): PublicTeam {
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    division: team.division,
    leagueSlug: team.league.slug,
    leagueName: team.league.name,
    logoUrl: safeImage(team.logoUrl),
    homeGround: team.homeGround,
    city: team.city,
    coach: team.coach,
    founded: null,
  };
}

function mapDbPlayer(player: DbPlayer): PublicPlayer {
  const activeTeam = player.teams?.find((assignment) => !assignment.leftAt) ?? player.teams?.[0];

  return {
    id: player.id,
    fullName: player.fullName,
    slug: player.slug,
    dateOfBirth: player.dateOfBirth.toISOString().slice(0, 10),
    position: player.position,
    hometown: player.hometown,
    jerseyNumber: player.jerseyNumber,
    teamSlug: activeTeam?.team.slug,
    teamName: activeTeam?.team.name,
    division: activeTeam?.team.division,
    photoUrl: safeImage(player.photoUrl),
    stats: combineStats(player.stats),
  };
}

function mapDbFixture(fixture: DbFixture, teamsById = new Map<string, { slug: string; name: string }>()): PublicFixture {
  return {
    id: fixture.id,
    leagueSlug: fixture.league.slug,
    leagueName: fixture.league.name,
    homeTeamSlug: fixture.homeTeam.slug,
    homeTeamName: fixture.homeTeam.name,
    awayTeamSlug: fixture.awayTeam.slug,
    awayTeamName: fixture.awayTeam.name,
    kickoffAt: fixture.kickoffAt.toISOString(),
    venue: fixture.venue.name,
    status: statusFromDb(fixture.status),
    homeScore: fixture.homeScore ?? undefined,
    awayScore: fixture.awayScore ?? undefined,
    events: (fixture.events ?? []).map((event) => {
      const team = teamsById.get(event.teamId);
      return {
        id: event.id,
        minute: event.minute,
        teamSlug: team?.slug ?? "",
        teamName: team?.name ?? "Team",
        playerSlug: event.player?.slug,
        playerName: event.player?.fullName ?? event.note ?? "Match event",
        type: eventTypeLabel(event.type),
        note: event.note,
      };
    }),
  };
}

function mapSampleLeague(league: (typeof sampleLeagues)[number]): PublicLeague {
  return {
    ...league,
    teamsCount: sampleTeams.filter((team) => team.leagueSlug === league.slug).length,
    logoUrl: DEFAULT_IMAGE,
  };
}

function mapSampleTeam(team: (typeof sampleTeams)[number]): PublicTeam {
  const league = sampleLeagues.find((item) => item.slug === team.leagueSlug);
  return {
    ...team,
    leagueName: league?.name ?? team.division,
    city: null,
  };
}

function samplePlayerStats(playerSlug: string) {
  const player = samplePlayers.find((item) => item.slug === playerSlug);
  if (!player) return emptyStats();
  const events = sampleMatchEvents.filter((event) => event.playerSlug === playerSlug);
  const appearances = sampleFixtures.filter(
    (fixture) =>
      (fixture.homeTeamSlug === player.teamSlug || fixture.awayTeamSlug === player.teamSlug) &&
      (fixture.status === "approved" || fixture.status === "submitted"),
  ).length;

  return {
    appearances,
    goals: events.filter((event) => event.type === "Goal").length,
    assists: events.filter((event) => event.type === "Assist").length,
    yellowCards: events.filter((event) => event.type === "Yellow card").length,
    redCards: events.filter((event) => event.type === "Red card").length,
  };
}

function mapSamplePlayer(player: (typeof samplePlayers)[number]): PublicPlayer {
  const team = sampleTeams.find((item) => item.slug === player.teamSlug);
  return {
    ...player,
    teamName: team?.name,
    division: team?.division,
    photoUrl: safeImage(player.photoUrl),
    stats: samplePlayerStats(player.slug),
  };
}

function mapSampleFixture(fixture: (typeof sampleFixtures)[number]): PublicFixture {
  const homeTeam = sampleTeams.find((team) => team.slug === fixture.homeTeamSlug);
  const awayTeam = sampleTeams.find((team) => team.slug === fixture.awayTeamSlug);
  const league = sampleLeagues.find((item) => item.slug === fixture.leagueSlug);

  return {
    ...fixture,
    leagueName: league?.name ?? fixture.leagueSlug,
    homeTeamName: homeTeam?.name ?? fixture.homeTeamSlug,
    awayTeamName: awayTeam?.name ?? fixture.awayTeamSlug,
    events: sampleMatchEvents
      .filter((event) => event.fixtureId === fixture.id)
      .map((event) => {
        const team = sampleTeams.find((item) => item.slug === event.teamSlug);
        const player = samplePlayers.find((item) => item.slug === event.playerSlug);
        return {
          id: `${event.fixtureId}-${event.minute}-${event.type}`,
          minute: event.minute,
          teamSlug: event.teamSlug,
          teamName: team?.name ?? event.teamSlug,
          playerSlug: event.playerSlug,
          playerName: player?.fullName ?? "Match event",
          type: event.type,
          note: event.note,
        };
      }),
  };
}

function computeStandings(teams: PublicTeam[], fixtures: PublicFixture[], leagueSlug: string) {
  const rows = new Map(
    teams
      .filter((team) => team.leagueSlug === leagueSlug)
      .map((team) => [
        team.slug,
        {
          team: { slug: team.slug, name: team.name },
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      ]),
  );

  for (const fixture of fixtures.filter((item) => item.leagueSlug === leagueSlug && item.status === "approved")) {
    if (fixture.homeScore === undefined || fixture.awayScore === undefined) continue;
    const home = rows.get(fixture.homeTeamSlug);
    const away = rows.get(fixture.awayTeamSlug);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += fixture.homeScore;
    home.goalsAgainst += fixture.awayScore;
    away.goalsFor += fixture.awayScore;
    away.goalsAgainst += fixture.homeScore;

    if (fixture.homeScore > fixture.awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (fixture.homeScore < fixture.awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return [...rows.values()]
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
}

function fallbackData() {
  const leagues = sampleLeagues.map(mapSampleLeague);
  const teams = sampleTeams.map(mapSampleTeam);
  const fixtures = sampleFixtures.map(mapSampleFixture);
  const players = samplePlayers.map(mapSamplePlayer);

  return { leagues, teams, fixtures, players };
}

async function getDbData() {
  const prisma = getPrisma();
  const [leagues, teams, players, fixtures] = await Promise.all([
    prisma.league.findMany({
      where: { isActive: true },
      include: { seasons: { orderBy: { year: "desc" }, take: 1 }, teams: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.team.findMany({
      include: { league: { select: { slug: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.player.findMany({
      include: {
        stats: true,
        teams: {
          include: { team: { include: { league: { select: { slug: true, name: true } } } } },
          orderBy: { joinedAt: "desc" },
        },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.fixture.findMany({
      include: {
        league: { select: { slug: true, name: true } },
        homeTeam: { select: { slug: true, name: true } },
        awayTeam: { select: { slug: true, name: true } },
        venue: { select: { name: true } },
        events: {
          include: { player: { select: { slug: true, fullName: true } } },
          orderBy: { minute: "asc" },
        },
      },
      orderBy: { kickoffAt: "asc" },
    }),
  ]);

  const teamNameById = new Map(teams.map((team) => [team.id, { slug: team.slug, name: team.name }]));
  return {
    leagues: leagues.map((league) => ({
      id: league.id,
      name: league.name,
      slug: league.slug,
      division: league.division,
      description: league.description,
      season: league.seasons[0]?.name ?? "Current season",
      teamsCount: league.teams.length,
      logoUrl: league.logoUrl,
    })),
    teams: teams.map(mapDbTeam),
    players: players.map(mapDbPlayer),
    fixtures: fixtures.map((fixture) => mapDbFixture(fixture, teamNameById)),
  };
}

async function getLiveData() {
  try {
    return await getDbData();
  } catch (error) {
    console.error("Public data fallback:", error);
    return fallbackData();
  }
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const { leagues, teams, players, fixtures } = await getLiveData();
  const upcoming = fixtures.filter((fixture) => fixture.status === "scheduled" || fixture.status === "submitted").slice(0, 3);
  const results = fixtures.filter((fixture) => fixture.status === "approved").slice(-2).reverse();
  const firstLeague = leagues.find((league) => league.division.toLowerCase().includes("first")) ?? leagues[0];

  return {
    leagues,
    teams,
    players,
    upcoming,
    results,
    featured: upcoming[0] ?? fixtures[0],
    firstStandings: firstLeague ? computeStandings(teams, fixtures, firstLeague.slug) : [],
  };
}

export async function getPublicLeagues() {
  return (await getLiveData()).leagues;
}

export async function getPublicLeague(slug: string): Promise<PublicLeagueDetail | null> {
  const { leagues, teams, players, fixtures } = await getLiveData();
  const league = leagues.find((item) => item.slug === slug);
  if (!league) return null;
  const leagueTeams = teams.filter((team) => team.leagueSlug === slug);
  const teamSlugs = new Set(leagueTeams.map((team) => team.slug));
  const topScorers = players
    .filter((player) => player.teamSlug && teamSlugs.has(player.teamSlug))
    .sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists)
    .slice(0, 6);

  return {
    ...league,
    teams: leagueTeams,
    fixtures: fixtures.filter((fixture) => fixture.leagueSlug === slug),
    standings: computeStandings(teams, fixtures, slug),
    topScorers,
  };
}

export async function getPublicTeam(slug: string): Promise<PublicTeamDetail | null> {
  const { teams, players, fixtures } = await getLiveData();
  const team = teams.find((item) => item.slug === slug);
  if (!team) return null;
  const teamFixtures = fixtures.filter((fixture) => fixture.homeTeamSlug === slug || fixture.awayTeamSlug === slug);
  const approved = teamFixtures.filter((fixture) => fixture.status === "approved");

  return {
    ...team,
    squad: players.filter((player) => player.teamSlug === slug),
    fixtures: teamFixtures,
    played: approved.length,
    goalsFor: approved.reduce(
      (sum, fixture) => sum + (fixture.homeTeamSlug === slug ? fixture.homeScore ?? 0 : fixture.awayScore ?? 0),
      0,
    ),
  };
}

export async function getPublicPlayer(slug: string) {
  const { players } = await getLiveData();
  return players.find((player) => player.slug === slug) ?? null;
}

export async function getPublicFixtures() {
  const { leagues, teams, fixtures } = await getLiveData();
  return {
    leagues,
    teams,
    fixtures: fixtures.filter((fixture) => fixture.status === "scheduled" || fixture.status === "submitted"),
  };
}

export async function getPublicResults() {
  const { fixtures } = await getLiveData();
  return fixtures.filter((fixture) => fixture.status === "approved" || fixture.status === "submitted").reverse();
}

export async function getPublicStandings() {
  const { leagues, teams, fixtures } = await getLiveData();
  return leagues.map((league) => ({
    league,
    rows: computeStandings(teams, fixtures, league.slug),
  }));
}
