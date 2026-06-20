import { PrismaClient, MatchStatus, MatchEventType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all(
    Object.values(UserRole).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: {
          name,
          description: name
            .toLowerCase()
            .split("_")
            .map((part) => part[0].toUpperCase() + part.slice(1))
            .join(" "),
        },
      }),
    ),
  );

  const season = await prisma.season.upsert({
    where: { id: "season-2026" },
    update: {},
    create: {
      id: "season-2026",
      name: "2026 Season",
      year: 2026,
      startsAt: new Date("2026-01-01"),
      endsAt: new Date("2026-12-31"),
      isCurrent: true,
    },
  });

  const firstDivision = await prisma.league.upsert({
    where: { slug: "first-division" },
    update: {},
    create: {
      name: "GFF First Division",
      slug: "first-division",
      division: "First Division",
      description: "Top-flight Gambian men's football competition.",
      seasons: { connect: { id: season.id } },
    },
  });

  const secondDivision = await prisma.league.upsert({
    where: { slug: "second-division" },
    update: {},
    create: {
      name: "GFF Second Division",
      slug: "second-division",
      division: "Second Division",
      description: "National second tier for promotion contenders.",
      seasons: { connect: { id: season.id } },
    },
  });

  const venues = await Promise.all(
    [
      ["independence-stadium", "Independence Stadium", "Bakau"],
      ["banjul-mini-stadium", "Banjul Mini Stadium", "Banjul"],
      ["box-bar-mini-stadium", "Box Bar Mini Stadium", "Brikama"],
    ].map(([id, name, city]) =>
      prisma.venue.upsert({
        where: { id },
        update: {},
        create: { id, name, city, capacity: 2500 },
      }),
    ),
  );

  const real = await prisma.team.upsert({
    where: { slug: "real-de-banjul" },
    update: {},
    create: {
      name: "Real de Banjul",
      slug: "real-de-banjul",
      logoUrl: "/gff-logo.jpg",
      division: "First Division",
      homeGround: "Banjul Mini Stadium",
      coach: "Lamin Jammeh",
      leagueId: firstDivision.id,
    },
  });

  const wallidan = await prisma.team.upsert({
    where: { slug: "wallidan-fc" },
    update: {},
    create: {
      name: "Wallidan FC",
      slug: "wallidan-fc",
      logoUrl: "/gff-logo.jpg",
      division: "First Division",
      homeGround: "Independence Stadium",
      coach: "Omar Sowe",
      leagueId: firstDivision.id,
    },
  });

  await prisma.team.upsert({
    where: { slug: "greater-tomorrow" },
    update: {},
    create: {
      name: "Greater Tomorrow",
      slug: "greater-tomorrow",
      logoUrl: "/gff-logo.jpg",
      division: "Second Division",
      homeGround: "Bakau Mini Stadium",
      coach: "Sainey Bojang",
      leagueId: secondDivision.id,
    },
  });

  const musa = await prisma.player.upsert({
    where: { slug: "musa-njie" },
    update: {},
    create: {
      fullName: "Musa Njie",
      slug: "musa-njie",
      photoUrl: "/gff-logo.jpg",
      dateOfBirth: new Date("2001-04-12"),
      position: "Forward",
      jerseyNumber: 9,
      teams: { create: { teamId: real.id, seasonId: season.id } },
    },
  });

  const bakary = await prisma.player.upsert({
    where: { slug: "bakary-sanyang" },
    update: {},
    create: {
      fullName: "Bakary Sanyang",
      slug: "bakary-sanyang",
      photoUrl: "/gff-logo.jpg",
      dateOfBirth: new Date("1999-08-02"),
      position: "Midfielder",
      jerseyNumber: 8,
      teams: { create: { teamId: wallidan.id, seasonId: season.id } },
    },
  });

  const fixture = await prisma.fixture.upsert({
    where: { id: "fixture-real-wallidan-2026" },
    update: {},
    create: {
      id: "fixture-real-wallidan-2026",
      leagueId: firstDivision.id,
      seasonId: season.id,
      homeTeamId: real.id,
      awayTeamId: wallidan.id,
      venueId: venues[0].id,
      kickoffAt: new Date("2026-06-12T18:00:00Z"),
      status: MatchStatus.APPROVED,
      homeScore: 2,
      awayScore: 1,
      approvedAt: new Date("2026-06-12T21:00:00Z"),
    },
  });

  await prisma.match.upsert({
    where: { fixtureId: fixture.id },
    update: {},
    create: { fixtureId: fixture.id, summary: "Opening sample result approved by Super Admin." },
  });

  await prisma.matchEvent.createMany({
    data: [
      { fixtureId: fixture.id, teamId: real.id, playerId: musa.id, minute: 12, type: MatchEventType.GOAL },
      { fixtureId: fixture.id, teamId: wallidan.id, playerId: bakary.id, minute: 44, type: MatchEventType.GOAL },
      { fixtureId: fixture.id, teamId: real.id, playerId: musa.id, minute: 78, type: MatchEventType.GOAL },
    ],
    skipDuplicates: true,
  });

  const superAdminRole = roles.find((role) => role.name === UserRole.SUPER_ADMIN);
  await prisma.user.upsert({
    where: { email: "admin@gff.gm" },
    update: {},
    create: {
      authId: "supabase-auth-user-id-placeholder",
      email: "admin@gff.gm",
      name: "GFF Leagues Super Admin",
      roleId: superAdminRole!.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "SEED_DATABASE",
      entity: "system",
      metadata: { leagues: 2, teams: 3, approvedFixtures: 1 },
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
