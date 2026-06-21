"use server";

import { MatchStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
}
