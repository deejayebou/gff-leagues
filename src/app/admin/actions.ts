"use server";

import { MatchStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

async function uniqueSlug(model: "league" | "team" | "player", base: string) {
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
          : await prisma.player.findUnique({ where: { slug } });

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
  const prisma = getPrisma();
  const name = value(formData, "recordName");
  const recordType = value(formData, "recordType");

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
  const prisma = getPrisma();
  const playerId = value(formData, "playerId");
  const teamId = value(formData, "teamId");
  const seasonId = value(formData, "seasonId");

  if (!playerId || !teamId || !seasonId) {
    redirect("/admin?status=Choose%20a%20player%2C%20team%2C%20and%20season");
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
  const prisma = getPrisma();
  const id = value(formData, "id");

  await prisma.league.update({
    where: { id },
    data: {
      name: value(formData, "name"),
      division: value(formData, "division"),
      description: value(formData, "description"),
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
  const prisma = getPrisma();
  const id = value(formData, "id");

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
  const prisma = getPrisma();
  const id = value(formData, "id");

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
