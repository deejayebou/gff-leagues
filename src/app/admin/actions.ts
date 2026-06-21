"use server";

import { MatchStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(model: "league" | "team" | "player" | "news", base: string) {
  const prisma = getPrisma();
  const cleanBase = slugify(base) || "record";
  let slug = cleanBase;
  let index = 2;

  while (true) {
    const existing =
      model === "league"
        ? await prisma.league.findUnique({ where: { slug } })
        : model === "team"
          ? await prisma.team.findUnique({ where: { slug } })
          : model === "player"
            ? await prisma.player.findUnique({ where: { slug } })
            : await prisma.newsPost.findUnique({ where: { slug } });

    if (!existing) return slug;
    slug = `${cleanBase}-${index}`;
    index += 1;
  }
}

function done(message: string) {
  revalidatePath("/admin");
  redirect(`/admin?status=${encodeURIComponent(message)}`);
}

export async function quickCreateRecord(formData: FormData) {
  const recordType = value(formData, "recordType");
  if (recordType === "Create/edit teams") {
    await requirePermission("manage_leagues");
  } else if (recordType === "Create/edit players") {
    await requirePermission("manage_own_team");
  } else if (recordType === "Create fixtures") {
    await requirePermission("manage_fixtures");
  } else {
    await requirePermission("manage_leagues");
  }

  const prisma = getPrisma();
  const name = value(formData, "recordName");

  if (!name) {
    redirect("/admin?status=Enter%20a%20record%20name%20first");
  }

  if (recordType === "Create/edit seasons") {
    const year = Number(name.match(/\d{4}/)?.[0] ?? new Date().getFullYear());
    const season = await prisma.season.create({
      data: {
        name,
        year,
        startsAt: new Date(`${year}-01-01T00:00:00Z`),
        endsAt: new Date(`${year}-12-31T23:59:59Z`),
      },
    });

    await prisma.auditLog.create({
      data: { action: "CREATE_SEASON", entity: "Season", entityId: season.id },
    });

    done(`Created season: ${season.name}`);
  }

  if (recordType === "Create/edit leagues") {
    const league = await prisma.league.create({
      data: {
        name,
        slug: await uniqueSlug("league", name),
        division: "New Division",
        description: "New league record. Edit details below.",
      },
    });

    await prisma.auditLog.create({
      data: { action: "CREATE_LEAGUE", entity: "League", entityId: league.id },
    });

    done(`Created league: ${league.name}`);
  }

  if (recordType === "Create/edit teams") {
    const league = await prisma.league.findFirst({ orderBy: { name: "asc" } });
    if (!league) {
      redirect("/admin?status=Create%20a%20league%20before%20creating%20teams");
    }

    const team = await prisma.team.create({
      data: {
        name,
        slug: await uniqueSlug("team", name),
        division: league.division,
        homeGround: "To be confirmed",
        coach: "To be confirmed",
        logoUrl: "/gff-logo.jpg",
        leagueId: league.id,
      },
    });

    await prisma.auditLog.create({
      data: { action: "CREATE_TEAM", entity: "Team", entityId: team.id },
    });

    done(`Created team: ${team.name}`);
  }

  if (recordType === "Create/edit players") {
    const player = await prisma.player.create({
      data: {
        fullName: name,
        slug: await uniqueSlug("player", name),
        dateOfBirth: new Date("2000-01-01T00:00:00Z"),
        position: "To be confirmed",
        jerseyNumber: 0,
        photoUrl: "/gff-logo.jpg",
      },
    });

    await prisma.auditLog.create({
      data: { action: "CREATE_PLAYER", entity: "Player", entityId: player.id },
    });

    done(`Created player: ${player.fullName}`);
  }

  await prisma.auditLog.create({
    data: { action: "CREATE_DRAFT", entity: recordType || "Record", metadata: { name } },
  });

  done(`Saved draft: ${name}`);
}

export async function assignPlayerToTeam(formData: FormData) {
  const user = await requirePermission("assign_players");
  const prisma = getPrisma();
  const playerId = value(formData, "playerId");
  const teamId = value(formData, "teamId");
  const seasonId = value(formData, "seasonId");

  if (!playerId || !teamId || !seasonId) {
    redirect("/admin?status=Choose%20a%20player%2C%20team%2C%20and%20season");
  }

  if (user.role.name === UserRole.TEAM_ADMIN && user.teamId !== teamId) {
    redirect("/admin?status=Team%20admins%20can%20only%20assign%20players%20to%20their%20own%20team");
  }

  const assignment = await prisma.teamPlayer.upsert({
    where: {
      teamId_playerId_seasonId: {
        teamId,
        playerId,
        seasonId,
      },
    },
    update: { leftAt: null },
    create: {
      teamId,
      playerId,
      seasonId,
    },
    include: {
      player: true,
      team: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "ASSIGN_PLAYER",
      entity: "TeamPlayer",
      entityId: assignment.id,
      metadata: {
        player: assignment.player.fullName,
        team: assignment.team.name,
      },
    },
  });

  done(`Assigned ${assignment.player.fullName} to ${assignment.team.name}`);
}

export async function moveTeamToLeague(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const teamId = value(formData, "teamId");
  const leagueId = value(formData, "leagueId");

  if (!teamId || !leagueId) {
    redirect("/admin?status=Choose%20a%20team%20and%20league");
  }

  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
  const team = await prisma.team.update({
    where: { id: teamId },
    data: {
      leagueId,
      division: league.division,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "MOVE_TEAM",
      entity: "Team",
      entityId: team.id,
      metadata: {
        team: team.name,
        league: league.name,
        division: league.division,
      },
    },
  });

  done(`Moved ${team.name} to ${league.division}`);
}

export async function updateLeague(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const id = value(formData, "id");

  await prisma.league.update({
    where: { id },
    data: {
      name: value(formData, "name"),
      division: value(formData, "division"),
      description: value(formData, "description"),
      logoUrl: value(formData, "logoUrl") || "/gff-logo.jpg",
      isActive: formData.get("isActive") === "on",
    },
  });

  await prisma.auditLog.create({
    data: { action: "UPDATE_LEAGUE", entity: "League", entityId: id },
  });

  revalidatePath("/admin");
  revalidatePath("/leagues");
  redirect("/admin?status=League%20saved");
}

export async function updateTeam(formData: FormData) {
  const user = await requirePermission("manage_own_team");
  const prisma = getPrisma();
  const id = value(formData, "id");

  if (user.role.name === UserRole.TEAM_ADMIN && user.teamId !== id) {
    redirect("/admin?status=Team%20admins%20can%20only%20edit%20their%20assigned%20team");
  }

  await prisma.team.update({
    where: { id },
    data: {
      name: value(formData, "name"),
      division: value(formData, "division"),
      homeGround: value(formData, "homeGround"),
      coach: value(formData, "coach"),
      logoUrl: value(formData, "logoUrl") || "/gff-logo.jpg",
    },
  });

  await prisma.auditLog.create({
    data: { action: "UPDATE_TEAM", entity: "Team", entityId: id },
  });

  revalidatePath("/admin");
  redirect("/admin?status=Team%20saved");
}

export async function updatePlayer(formData: FormData) {
  const user = await requirePermission("manage_own_team");
  const prisma = getPrisma();
  const id = value(formData, "id");

  if (user.role.name === UserRole.TEAM_ADMIN) {
    const isSquadPlayer = await prisma.teamPlayer.findFirst({
      where: {
        playerId: id,
        teamId: user.teamId ?? "",
        leftAt: null,
      },
    });

    if (!isSquadPlayer) {
      redirect("/admin?status=Team%20admins%20can%20only%20edit%20players%20on%20their%20squad");
    }
  }

  await prisma.player.update({
    where: { id },
    data: {
      fullName: value(formData, "fullName"),
      position: value(formData, "position"),
      jerseyNumber: Number(value(formData, "jerseyNumber") || 0),
      dateOfBirth: new Date(value(formData, "dateOfBirth")),
      photoUrl: value(formData, "photoUrl") || "/gff-logo.jpg",
    },
  });

  await prisma.auditLog.create({
    data: { action: "UPDATE_PLAYER", entity: "Player", entityId: id },
  });

  revalidatePath("/admin");
  redirect("/admin?status=Player%20saved");
}

export async function approveFixture(formData: FormData) {
  await requirePermission("all");
  const prisma = getPrisma();
  const id = value(formData, "id");

  await prisma.fixture.update({
    where: { id },
    data: {
      status: MatchStatus.APPROVED,
      approvedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: { action: "APPROVE_RESULT", entity: "Fixture", entityId: id },
  });

  revalidatePath("/admin");
  redirect("/admin?status=Result%20approved");
}

export async function rejectFixture(formData: FormData) {
  await requirePermission("all");
  const prisma = getPrisma();
  const id = value(formData, "id");

  await prisma.fixture.update({
    where: { id },
    data: { status: MatchStatus.REJECTED },
  });

  await prisma.auditLog.create({
    data: { action: "REJECT_RESULT", entity: "Fixture", entityId: id },
  });

  revalidatePath("/admin");
  redirect("/admin?status=Result%20rejected");
}

export async function updateUserRole(formData: FormData) {
  await requirePermission("all");
  const prisma = getPrisma();
  const userId = value(formData, "userId");
  const roleId = value(formData, "roleId");
  const teamId = value(formData, "teamId") || null;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { roleId, teamId },
    include: { role: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_USER_ROLE",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role.name },
    },
  });

  done(`Updated role for ${user.email}`);
}

export async function createNewsPost(formData: FormData) {
  await requirePermission("manage_news");
  const prisma = getPrisma();
  const title = value(formData, "title");
  const excerpt = value(formData, "excerpt");
  const body = value(formData, "body");
  const leagueId = value(formData, "leagueId") || null;
  const coverImageUrl = value(formData, "coverImageUrl") || "/gff-logo.jpg";

  if (!title || !excerpt || !body) {
    redirect("/admin?status=News%20needs%20a%20title%2C%20excerpt%2C%20and%20body");
  }

  const post = await prisma.newsPost.create({
    data: {
      title,
      slug: await uniqueSlug("news", title),
      excerpt,
      body,
      coverImageUrl,
      leagueId,
    },
  });

  await prisma.auditLog.create({
    data: { action: "CREATE_NEWS", entity: "NewsPost", entityId: post.id },
  });

  revalidatePath("/");
  revalidatePath("/news");
  done(`Published news: ${post.title}`);
}

export async function createFixture(formData: FormData) {
  await requirePermission("manage_fixtures");
  const prisma = getPrisma();
  const leagueId = value(formData, "leagueId");
  const seasonId = value(formData, "seasonId");
  const homeTeamId = value(formData, "homeTeamId");
  const awayTeamId = value(formData, "awayTeamId");
  const venueId = value(formData, "venueId");
  const kickoffAt = value(formData, "kickoffAt");

  if (!leagueId || !seasonId || !homeTeamId || !awayTeamId || !venueId || !kickoffAt) {
    redirect("/admin?status=Fill%20out%20all%20fixture%20fields");
  }

  if (homeTeamId === awayTeamId) {
    redirect("/admin?status=Home%20and%20away%20teams%20must%20be%20different");
  }

  const fixture = await prisma.fixture.create({
    data: {
      leagueId,
      seasonId,
      homeTeamId,
      awayTeamId,
      venueId,
      kickoffAt: new Date(kickoffAt),
      status: MatchStatus.SCHEDULED,
    },
    include: { homeTeam: true, awayTeam: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE_FIXTURE",
      entity: "Fixture",
      entityId: fixture.id,
      metadata: {
        home: fixture.homeTeam.name,
        away: fixture.awayTeam.name,
      },
    },
  });

  done(`Created fixture: ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
}

export async function submitFixtureResult(formData: FormData) {
  await requirePermission("submit_results");
  const prisma = getPrisma();
  const fixtureId = value(formData, "fixtureId");
  const homeScore = Number(value(formData, "homeScore"));
  const awayScore = Number(value(formData, "awayScore"));
  const notes = value(formData, "notes");

  if (!fixtureId || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    redirect("/admin?status=Choose%20a%20fixture%20and%20enter%20both%20scores");
  }

  const fixture = await prisma.fixture.update({
    where: { id: fixtureId },
    data: {
      homeScore,
      awayScore,
      status: MatchStatus.SUBMITTED,
      match: {
        upsert: {
          create: { summary: notes || "Submitted for approval." },
          update: { summary: notes || "Submitted for approval." },
        },
      },
    },
    include: { homeTeam: true, awayTeam: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "SUBMIT_RESULT",
      entity: "Fixture",
      entityId: fixture.id,
      metadata: {
        score: `${fixture.homeTeam.name} ${homeScore}-${awayScore} ${fixture.awayTeam.name}`,
      },
    },
  });

  done(`Submitted result: ${fixture.homeTeam.name} ${homeScore}-${awayScore} ${fixture.awayTeam.name}`);
}
