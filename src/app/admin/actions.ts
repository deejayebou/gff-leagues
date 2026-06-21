"use server";

import { MatchEventType, MatchStatus, UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
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

function doneIn(section: string, message: string) {
  revalidatePath("/admin");
  redirect(`/admin?section=${section}&status=${encodeURIComponent(message)}`);
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const parsed = Number(value(formData, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function supabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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
  redirect("/admin?section=leagues&status=League%20saved");
}

export async function createLeague(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const name = value(formData, "name");
  const division = value(formData, "division");

  if (!name || !division) {
    redirect("/admin?section=leagues&status=League%20name%20and%20division%20are%20required");
  }

  const league = await prisma.league.create({
    data: {
      name,
      slug: await uniqueSlug("league", name),
      division,
      description: value(formData, "description") || "League record created in admin.",
      logoUrl: value(formData, "logoUrl") || "/gff-logo.jpg",
      isActive: formData.get("isActive") === "on",
    },
  });

  await prisma.auditLog.create({
    data: { action: "CREATE_LEAGUE", entity: "League", entityId: league.id },
  });

  doneIn("leagues", `Created league: ${league.name}`);
}

export async function deleteLeague(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const id = value(formData, "id");

  try {
    await prisma.league.delete({ where: { id } });
    await prisma.auditLog.create({ data: { action: "DELETE_LEAGUE", entity: "League", entityId: id } });
    doneIn("leagues", "League deleted");
  } catch {
    redirect("/admin?section=leagues&status=League%20has%20teams%2C%20fixtures%2C%20or%20stats%20attached");
  }
}

async function updateCurrentSeason(prisma: ReturnType<typeof getPrisma>, seasonId: string, isCurrent: boolean) {
  if (!isCurrent) return;
  await prisma.season.updateMany({
    where: { id: { not: seasonId } },
    data: { isCurrent: false },
  });
}

function selectedLeagueIds(formData: FormData) {
  return formData.getAll("leagueIds").map(String).filter(Boolean);
}

export async function createSeason(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const name = value(formData, "name");
  const year = numberValue(formData, "year", new Date().getFullYear());
  const startsAt = value(formData, "startsAt");
  const endsAt = value(formData, "endsAt");
  const isCurrent = formData.get("isCurrent") === "on";
  const leagueIds = selectedLeagueIds(formData);

  if (!name || !startsAt || !endsAt) {
    redirect("/admin?section=seasons&status=Season%20name%2C%20start%20date%2C%20and%20end%20date%20are%20required");
  }

  const season = await prisma.season.create({
    data: {
      name,
      year,
      startsAt: new Date(`${startsAt}T00:00:00Z`),
      endsAt: new Date(`${endsAt}T23:59:59Z`),
      isCurrent,
      leagues: { connect: leagueIds.map((id) => ({ id })) },
    },
  });

  await updateCurrentSeason(prisma, season.id, isCurrent);
  await prisma.auditLog.create({ data: { action: "CREATE_SEASON", entity: "Season", entityId: season.id } });
  doneIn("seasons", `Created season: ${season.name}`);
}

export async function updateSeason(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const id = value(formData, "id");
  const isCurrent = formData.get("isCurrent") === "on";
  const leagueIds = selectedLeagueIds(formData);

  await prisma.season.update({
    where: { id },
    data: {
      name: value(formData, "name"),
      year: numberValue(formData, "year", new Date().getFullYear()),
      startsAt: new Date(`${value(formData, "startsAt")}T00:00:00Z`),
      endsAt: new Date(`${value(formData, "endsAt")}T23:59:59Z`),
      isCurrent,
      leagues: { set: leagueIds.map((leagueId) => ({ id: leagueId })) },
    },
  });

  await updateCurrentSeason(prisma, id, isCurrent);
  await prisma.auditLog.create({ data: { action: "UPDATE_SEASON", entity: "Season", entityId: id } });
  revalidatePath("/admin");
  revalidatePath("/leagues");
  redirect("/admin?section=seasons&status=Season%20saved");
}

export async function deleteSeason(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const id = value(formData, "id");

  try {
    await prisma.season.delete({ where: { id } });
    await prisma.auditLog.create({ data: { action: "DELETE_SEASON", entity: "Season", entityId: id } });
    doneIn("seasons", "Season deleted");
  } catch {
    redirect("/admin?section=seasons&status=Season%20has%20fixtures%2C%20registrations%2C%20or%20standings%20attached");
  }
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
      city: value(formData, "city") || null,
      coach: value(formData, "coach"),
      logoUrl: value(formData, "logoUrl") || "/gff-logo.jpg",
    },
  });

  await prisma.auditLog.create({
    data: { action: "UPDATE_TEAM", entity: "Team", entityId: id },
  });

  revalidatePath("/admin");
  redirect("/admin?section=teams&status=Team%20saved");
}

export async function createTeam(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const name = value(formData, "name");
  const leagueId = value(formData, "leagueId");

  if (!name || !leagueId) {
    redirect("/admin?section=teams&status=Team%20name%20and%20league%20are%20required");
  }

  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
  const team = await prisma.team.create({
    data: {
      name,
      slug: await uniqueSlug("team", name),
      leagueId,
      division: league.division,
      homeGround: value(formData, "homeGround") || "To be confirmed",
      city: value(formData, "city") || null,
      coach: value(formData, "coach") || "To be confirmed",
      logoUrl: value(formData, "logoUrl") || "/gff-logo.jpg",
    },
  });

  await prisma.auditLog.create({
    data: { action: "CREATE_TEAM", entity: "Team", entityId: team.id },
  });

  doneIn("teams", `Created team: ${team.name}`);
}

export async function deleteTeam(formData: FormData) {
  await requirePermission("manage_leagues");
  const prisma = getPrisma();
  const id = value(formData, "id");

  try {
    await prisma.team.delete({ where: { id } });
    await prisma.auditLog.create({ data: { action: "DELETE_TEAM", entity: "Team", entityId: id } });
    doneIn("teams", "Team deleted");
  } catch {
    redirect("/admin?section=teams&status=Team%20has%20players%2C%20fixtures%2C%20or%20stats%20attached");
  }
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
      hometown: value(formData, "hometown") || null,
      jerseyNumber: Number(value(formData, "jerseyNumber") || 0),
      dateOfBirth: new Date(value(formData, "dateOfBirth")),
      photoUrl: value(formData, "photoUrl") || "/gff-logo.jpg",
    },
  });

  await prisma.auditLog.create({
    data: { action: "UPDATE_PLAYER", entity: "Player", entityId: id },
  });

  revalidatePath("/admin");
  redirect("/admin?section=players&status=Player%20saved");
}

export async function createPlayer(formData: FormData) {
  const user = await requirePermission("manage_own_team");
  const prisma = getPrisma();
  const fullName = value(formData, "fullName");
  const teamId = value(formData, "teamId");
  const seasonId = value(formData, "seasonId");

  if (!fullName) {
    redirect("/admin?section=players&status=Player%20name%20is%20required");
  }

  if (user.role.name === UserRole.TEAM_ADMIN && teamId && user.teamId !== teamId) {
    redirect("/admin?section=players&status=Team%20admins%20can%20only%20add%20players%20to%20their%20assigned%20team");
  }

  const player = await prisma.player.create({
    data: {
      fullName,
      slug: await uniqueSlug("player", fullName),
      dateOfBirth: new Date(value(formData, "dateOfBirth") || "2000-01-01"),
      position: value(formData, "position") || "To be confirmed",
      hometown: value(formData, "hometown") || null,
      jerseyNumber: numberValue(formData, "jerseyNumber"),
      photoUrl: value(formData, "photoUrl") || "/gff-logo.jpg",
    },
  });

  if (teamId && seasonId) {
    await prisma.teamPlayer.upsert({
      where: { teamId_playerId_seasonId: { teamId, playerId: player.id, seasonId } },
      update: { leftAt: null },
      create: { teamId, playerId: player.id, seasonId },
    });
  }

  await prisma.auditLog.create({
    data: { action: "CREATE_PLAYER", entity: "Player", entityId: player.id },
  });

  doneIn("players", `Created player: ${player.fullName}`);
}

export async function deletePlayer(formData: FormData) {
  await requirePermission("manage_own_team");
  const prisma = getPrisma();
  const id = value(formData, "id");

  try {
    await prisma.player.delete({ where: { id } });
    await prisma.auditLog.create({ data: { action: "DELETE_PLAYER", entity: "Player", entityId: id } });
    doneIn("players", "Player deleted");
  } catch {
    redirect("/admin?section=players&status=Player%20has%20squad%20history%2C%20events%2C%20or%20stats%20attached");
  }
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

export async function createAdminUser(formData: FormData) {
  await requirePermission("all");
  const prisma = getPrisma();
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const name = value(formData, "name") || null;
  const roleId = value(formData, "roleId");
  const teamId = value(formData, "teamId") || null;
  const supabase = supabaseAdminClient();

  if (!email || !password || !roleId) {
    redirect("/admin?section=users&status=Email%2C%20password%2C%20and%20role%20are%20required");
  }

  if (!supabase) {
    redirect("/admin?section=users&status=Add%20SUPABASE_SERVICE_ROLE_KEY%20in%20Vercel%20to%20create%20login%20users");
  }

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (created.error || !created.data.user) {
    redirect(`/admin?section=users&status=${encodeURIComponent(created.error?.message ?? "Could not create Supabase user")}`);
  }

  const user = await prisma.user.upsert({
    where: { authId: created.data.user.id },
    update: { email, name, roleId, teamId },
    create: {
      authId: created.data.user.id,
      email,
      name,
      roleId,
      teamId,
    },
  });

  await prisma.auditLog.create({
    data: { action: "CREATE_USER", entity: "User", entityId: user.id, metadata: { email } },
  });

  doneIn("users", `Created user: ${email}`);
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
  doneIn("news", `Published news: ${post.title}`);
}

export async function updateNewsPost(formData: FormData) {
  await requirePermission("manage_news");
  const prisma = getPrisma();
  const id = value(formData, "id");
  const title = value(formData, "title");
  const excerpt = value(formData, "excerpt");
  const body = value(formData, "body");

  if (!id || !title || !excerpt || !body) {
    redirect("/admin?section=news&status=News%20needs%20a%20title%2C%20excerpt%2C%20and%20body");
  }

  const post = await prisma.newsPost.update({
    where: { id },
    data: {
      title,
      excerpt,
      body,
      leagueId: value(formData, "leagueId") || null,
      coverImageUrl: value(formData, "coverImageUrl") || "/gff-logo.jpg",
    },
  });

  await prisma.auditLog.create({
    data: { action: "UPDATE_NEWS", entity: "NewsPost", entityId: post.id },
  });

  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath(`/news/${post.slug}`);
  doneIn("news", `Updated news: ${post.title}`);
}

export async function deleteNewsPost(formData: FormData) {
  await requirePermission("manage_news");
  const prisma = getPrisma();
  const id = value(formData, "id");

  await prisma.newsPost.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { action: "DELETE_NEWS", entity: "NewsPost", entityId: id },
  });

  revalidatePath("/");
  revalidatePath("/news");
  doneIn("news", "News article deleted");
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
    include: { homeTeam: true, awayTeam: true, league: true, season: true },
  });

  await prisma.teamStat.upsert({
    where: {
      teamId_leagueId_seasonId: {
        teamId: fixture.homeTeamId,
        leagueId: fixture.leagueId,
        seasonId: fixture.seasonId,
      },
    },
    update: {
      cleanSheets: numberValue(formData, "homeCleanSheet"),
      form: value(formData, "homeForm"),
    },
    create: {
      teamId: fixture.homeTeamId,
      leagueId: fixture.leagueId,
      seasonId: fixture.seasonId,
      cleanSheets: numberValue(formData, "homeCleanSheet"),
      form: value(formData, "homeForm"),
    },
  });

  await prisma.teamStat.upsert({
    where: {
      teamId_leagueId_seasonId: {
        teamId: fixture.awayTeamId,
        leagueId: fixture.leagueId,
        seasonId: fixture.seasonId,
      },
    },
    update: {
      cleanSheets: numberValue(formData, "awayCleanSheet"),
      form: value(formData, "awayForm"),
    },
    create: {
      teamId: fixture.awayTeamId,
      leagueId: fixture.leagueId,
      seasonId: fixture.seasonId,
      cleanSheets: numberValue(formData, "awayCleanSheet"),
      form: value(formData, "awayForm"),
    },
  });

  await prisma.matchEvent.deleteMany({ where: { fixtureId } });

  for (let index = 0; index < 6; index += 1) {
    const type = value(formData, `eventType_${index}`);
    const teamId = value(formData, `eventTeamId_${index}`);
    const minute = numberValue(formData, `eventMinute_${index}`, -1);

    if (!type || !teamId || minute < 0) continue;

    await prisma.matchEvent.create({
      data: {
        fixtureId,
        teamId,
        playerId: value(formData, `eventPlayerId_${index}`) || null,
        minute,
        type: type as MatchEventType,
        note: value(formData, `eventNote_${index}`) || null,
      },
    });
  }

  for (let index = 0; index < 8; index += 1) {
    const playerId = value(formData, `statPlayerId_${index}`);
    if (!playerId) continue;

    await prisma.playerStat.upsert({
      where: {
        playerId_leagueId_seasonId: {
          playerId,
          leagueId: fixture.leagueId,
          seasonId: fixture.seasonId,
        },
      },
      update: {
        appearances: { increment: numberValue(formData, `statAppearances_${index}`) },
        goals: { increment: numberValue(formData, `statGoals_${index}`) },
        assists: { increment: numberValue(formData, `statAssists_${index}`) },
        yellowCards: { increment: numberValue(formData, `statYellowCards_${index}`) },
        redCards: { increment: numberValue(formData, `statRedCards_${index}`) },
      },
      create: {
        playerId,
        leagueId: fixture.leagueId,
        seasonId: fixture.seasonId,
        appearances: numberValue(formData, `statAppearances_${index}`),
        goals: numberValue(formData, `statGoals_${index}`),
        assists: numberValue(formData, `statAssists_${index}`),
        yellowCards: numberValue(formData, `statYellowCards_${index}`),
        redCards: numberValue(formData, `statRedCards_${index}`),
      },
    });
  }

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

  doneIn("results", `Submitted result and stats: ${fixture.homeTeam.name} ${homeScore}-${awayScore} ${fixture.awayTeam.name}`);
}
