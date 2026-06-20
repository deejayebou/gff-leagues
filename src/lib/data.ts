export type Role =
  | "Super Admin"
  | "League Admin"
  | "Team Admin"
  | "Match Official/Data Entry"
  | "Public User";

export type League = {
  id: string;
  name: string;
  slug: string;
  division: string;
  description: string;
  season: string;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  division: string;
  leagueSlug: string;
  logoUrl: string;
  homeGround: string;
  coach: string;
  founded: number;
};

export type Player = {
  id: string;
  fullName: string;
  slug: string;
  dateOfBirth: string;
  position: string;
  jerseyNumber: number;
  teamSlug: string;
  photoUrl: string;
};

export type Fixture = {
  id: string;
  leagueSlug: string;
  homeTeamSlug: string;
  awayTeamSlug: string;
  kickoffAt: string;
  venue: string;
  status: "scheduled" | "submitted" | "approved" | "rejected";
  homeScore?: number;
  awayScore?: number;
};

export type MatchEvent = {
  fixtureId: string;
  minute: number;
  teamSlug: string;
  playerSlug?: string;
  type: "Goal" | "Assist" | "Yellow card" | "Red card" | "Substitution";
  note?: string;
};

export const roles: Role[] = [
  "Super Admin",
  "League Admin",
  "Team Admin",
  "Match Official/Data Entry",
  "Public User",
];

export const leagues: League[] = [
  {
    id: "l1",
    name: "GFF First Division",
    slug: "first-division",
    division: "First Division",
    description: "Top-flight Gambian men's football competition.",
    season: "2026",
  },
  {
    id: "l2",
    name: "GFF Second Division",
    slug: "second-division",
    division: "Second Division",
    description: "National second tier for promotion contenders.",
    season: "2026",
  },
  {
    id: "l3",
    name: "GFF Third Division",
    slug: "third-division",
    division: "Third Division",
    description: "Regional pathway league for emerging clubs.",
    season: "2026",
  },
  {
    id: "l4",
    name: "GFF Youth League U20",
    slug: "youth-u20",
    division: "Youth League",
    description: "Development competition for U20 academies.",
    season: "2026",
  },
  {
    id: "l5",
    name: "FF Cup",
    slug: "ff-cup",
    division: "Cup Tournament",
    description: "Knockout cup competition for clubs across divisions.",
    season: "2026",
  },
  {
    id: "l6",
    name: "GFF Women's League",
    slug: "womens-league",
    division: "Future Women's League",
    description: "Prepared data model for future women's league expansion.",
    season: "Coming soon",
  },
];

export const teams: Team[] = [
  {
    id: "t1",
    name: "Real de Banjul",
    slug: "real-de-banjul",
    division: "First Division",
    leagueSlug: "first-division",
    logoUrl: "/gff-logo.jpg",
    homeGround: "Banjul Mini Stadium",
    coach: "Lamin Jammeh",
    founded: 1966,
  },
  {
    id: "t2",
    name: "Wallidan FC",
    slug: "wallidan-fc",
    division: "First Division",
    leagueSlug: "first-division",
    logoUrl: "/gff-logo.jpg",
    homeGround: "Independence Stadium",
    coach: "Omar Sowe",
    founded: 1969,
  },
  {
    id: "t3",
    name: "Brikama United",
    slug: "brikama-united",
    division: "First Division",
    leagueSlug: "first-division",
    logoUrl: "/gff-logo.jpg",
    homeGround: "Box Bar Mini Stadium",
    coach: "Pa Modou Jallow",
    founded: 2005,
  },
  {
    id: "t4",
    name: "Fortune FC",
    slug: "fortune-fc",
    division: "First Division",
    leagueSlug: "first-division",
    logoUrl: "/gff-logo.jpg",
    homeGround: "Late Ousman Saho Field",
    coach: "Ebrima Manneh",
    founded: 2003,
  },
  {
    id: "t5",
    name: "Greater Tomorrow",
    slug: "greater-tomorrow",
    division: "Second Division",
    leagueSlug: "second-division",
    logoUrl: "/gff-logo.jpg",
    homeGround: "Bakau Mini Stadium",
    coach: "Sainey Bojang",
    founded: 2018,
  },
  {
    id: "t6",
    name: "Jam City",
    slug: "jam-city",
    division: "Second Division",
    leagueSlug: "second-division",
    logoUrl: "/gff-logo.jpg",
    homeGround: "Serrekunda East Mini Stadium",
    coach: "Alieu Ceesay",
    founded: 2001,
  },
];

export const players: Player[] = [
  {
    id: "p1",
    fullName: "Musa Njie",
    slug: "musa-njie",
    dateOfBirth: "2001-04-12",
    position: "Forward",
    jerseyNumber: 9,
    teamSlug: "real-de-banjul",
    photoUrl: "/gff-logo.jpg",
  },
  {
    id: "p2",
    fullName: "Bakary Sanyang",
    slug: "bakary-sanyang",
    dateOfBirth: "1999-08-02",
    position: "Midfielder",
    jerseyNumber: 8,
    teamSlug: "wallidan-fc",
    photoUrl: "/gff-logo.jpg",
  },
  {
    id: "p3",
    fullName: "Ebrima Touray",
    slug: "ebrima-touray",
    dateOfBirth: "2002-11-20",
    position: "Winger",
    jerseyNumber: 11,
    teamSlug: "brikama-united",
    photoUrl: "/gff-logo.jpg",
  },
  {
    id: "p4",
    fullName: "Alagie Jobe",
    slug: "alagie-jobe",
    dateOfBirth: "1998-01-30",
    position: "Goalkeeper",
    jerseyNumber: 1,
    teamSlug: "fortune-fc",
    photoUrl: "/gff-logo.jpg",
  },
  {
    id: "p5",
    fullName: "Momodou Ceesay",
    slug: "momodou-ceesay",
    dateOfBirth: "2000-06-18",
    position: "Defender",
    jerseyNumber: 4,
    teamSlug: "greater-tomorrow",
    photoUrl: "/gff-logo.jpg",
  },
  {
    id: "p6",
    fullName: "Sulayman Barrow",
    slug: "sulayman-barrow",
    dateOfBirth: "2003-02-25",
    position: "Forward",
    jerseyNumber: 10,
    teamSlug: "jam-city",
    photoUrl: "/gff-logo.jpg",
  },
];

export const fixtures: Fixture[] = [
  {
    id: "f1",
    leagueSlug: "first-division",
    homeTeamSlug: "real-de-banjul",
    awayTeamSlug: "wallidan-fc",
    kickoffAt: "2026-06-12T18:00:00+00:00",
    venue: "Independence Stadium",
    status: "approved",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "f2",
    leagueSlug: "first-division",
    homeTeamSlug: "brikama-united",
    awayTeamSlug: "fortune-fc",
    kickoffAt: "2026-06-13T17:30:00+00:00",
    venue: "Box Bar Mini Stadium",
    status: "approved",
    homeScore: 0,
    awayScore: 0,
  },
  {
    id: "f3",
    leagueSlug: "first-division",
    homeTeamSlug: "real-de-banjul",
    awayTeamSlug: "brikama-united",
    kickoffAt: "2026-06-23T18:00:00+00:00",
    venue: "Banjul Mini Stadium",
    status: "scheduled",
  },
  {
    id: "f4",
    leagueSlug: "first-division",
    homeTeamSlug: "fortune-fc",
    awayTeamSlug: "wallidan-fc",
    kickoffAt: "2026-06-24T18:00:00+00:00",
    venue: "Late Ousman Saho Field",
    status: "scheduled",
  },
  {
    id: "f5",
    leagueSlug: "second-division",
    homeTeamSlug: "greater-tomorrow",
    awayTeamSlug: "jam-city",
    kickoffAt: "2026-06-25T17:00:00+00:00",
    venue: "Bakau Mini Stadium",
    status: "submitted",
    homeScore: 1,
    awayScore: 1,
  },
];

export const matchEvents: MatchEvent[] = [
  { fixtureId: "f1", minute: 12, teamSlug: "real-de-banjul", playerSlug: "musa-njie", type: "Goal" },
  { fixtureId: "f1", minute: 44, teamSlug: "wallidan-fc", playerSlug: "bakary-sanyang", type: "Goal" },
  { fixtureId: "f1", minute: 78, teamSlug: "real-de-banjul", playerSlug: "musa-njie", type: "Goal" },
  { fixtureId: "f1", minute: 82, teamSlug: "wallidan-fc", playerSlug: "bakary-sanyang", type: "Yellow card" },
  { fixtureId: "f2", minute: 61, teamSlug: "fortune-fc", playerSlug: "alagie-jobe", type: "Yellow card" },
  { fixtureId: "f5", minute: 33, teamSlug: "greater-tomorrow", playerSlug: "momodou-ceesay", type: "Goal" },
  { fixtureId: "f5", minute: 71, teamSlug: "jam-city", playerSlug: "sulayman-barrow", type: "Goal" },
];

export function getTeam(slug: string) {
  return teams.find((team) => team.slug === slug);
}

export function getLeague(slug: string) {
  return leagues.find((league) => league.slug === slug);
}

export function getPlayer(slug: string) {
  return players.find((player) => player.slug === slug);
}

export function teamName(slug: string) {
  return getTeam(slug)?.name ?? slug;
}

export function playerName(slug?: string) {
  if (!slug) return "Unknown player";
  return getPlayer(slug)?.fullName ?? slug;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GM", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function age(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  return years;
}

export function fixturesForLeague(leagueSlug: string) {
  return fixtures.filter((fixture) => fixture.leagueSlug === leagueSlug);
}

export function fixturesForTeam(teamSlug: string) {
  return fixtures.filter(
    (fixture) => fixture.homeTeamSlug === teamSlug || fixture.awayTeamSlug === teamSlug,
  );
}

export function approvedResults() {
  return fixtures.filter((fixture) => fixture.status === "approved");
}

export function computeStandings(leagueSlug = "first-division") {
  const leagueTeams = teams.filter((team) => team.leagueSlug === leagueSlug);
  const rows = new Map(
    leagueTeams.map((team) => [
      team.slug,
      {
        team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [] as string[],
      },
    ]),
  );

  for (const fixture of approvedResults().filter((item) => item.leagueSlug === leagueSlug)) {
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
      away.losses += 1;
      home.points += 3;
      home.form.unshift("W");
      away.form.unshift("L");
    } else if (fixture.homeScore < fixture.awayScore) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
      away.form.unshift("W");
      home.form.unshift("L");
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
      home.form.unshift("D");
      away.form.unshift("D");
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
      form: row.form.slice(0, 5),
    }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
}

export function playerStats(playerSlug: string) {
  const player = getPlayer(playerSlug);
  if (!player) return null;
  const events = matchEvents.filter((event) => event.playerSlug === playerSlug);
  const appearances = fixturesForTeam(player.teamSlug).filter(
    (fixture) => fixture.status === "approved" || fixture.status === "submitted",
  ).length;
  return {
    appearances,
    goals: events.filter((event) => event.type === "Goal").length,
    assists: events.filter((event) => event.type === "Assist").length,
    yellowCards: events.filter((event) => event.type === "Yellow card").length,
    redCards: events.filter((event) => event.type === "Red card").length,
  };
}

export const auditLogSamples = [
  "Approved Real de Banjul 2-1 Wallidan FC",
  "Created 2026 GFF Youth League season",
  "Updated Fortune FC squad registration",
  "Rejected duplicate result submission for fixture F-142",
];
