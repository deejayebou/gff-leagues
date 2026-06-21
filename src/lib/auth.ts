import { UserRole, type User } from "@prisma/client";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type AppUser = User & {
  role: {
    name: UserRole;
    description: string;
  };
};

const roleDescriptions: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  LEAGUE_ADMIN: "League Admin",
  TEAM_ADMIN: "Team Admin",
  MATCH_OFFICIAL: "Match Official/Data Entry",
  PUBLIC_USER: "Public User",
};

export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  LEAGUE_ADMIN: "League Admin",
  TEAM_ADMIN: "Team Admin",
  MATCH_OFFICIAL: "Match Official/Data Entry",
  PUBLIC_USER: "Public User",
};

export const rolePermissions: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    "Manage leagues, seasons, teams, players, venues, users, roles, approvals, news, and audit logs.",
  ],
  LEAGUE_ADMIN: [
    "Create fixtures, manage league records, review team registrations, publish league news, and prepare standings reports.",
  ],
  TEAM_ADMIN: [
    "Update assigned team profile, maintain squad records, and manage team/player media.",
  ],
  MATCH_OFFICIAL: [
    "Submit match scores, scorers, cards, substitutions, and match notes for assigned fixtures.",
  ],
  PUBLIC_USER: ["Browse public league data."],
};

const permissions: Record<UserRole, Set<string>> = {
  SUPER_ADMIN: new Set(["all"]),
  LEAGUE_ADMIN: new Set(["manage_leagues", "manage_fixtures", "manage_news", "view_reports"]),
  TEAM_ADMIN: new Set(["manage_own_team", "assign_players"]),
  MATCH_OFFICIAL: new Set(["submit_results"]),
  PUBLIC_USER: new Set([]),
};

export function can(user: AppUser, permission: string) {
  const allowed = permissions[user.role.name];
  return allowed.has("all") || allowed.has(permission);
}

async function ensureRole(name: UserRole) {
  const prisma = getPrisma();
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: {
      name,
      description: roleDescriptions[name],
    },
  });
}

function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getCurrentAppUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  const user = data.user;

  if (!user?.email) return null;

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { role: true },
  });

  const shouldBeSuperAdmin = configuredAdminEmails().includes(user.email.toLowerCase());
  const role = await ensureRole(shouldBeSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.PUBLIC_USER);

  if (existing) {
    if (shouldBeSuperAdmin && existing.role.name !== UserRole.SUPER_ADMIN) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { roleId: role.id },
        include: { role: true },
      });
    }

    return existing;
  }

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      authId: user.id,
      roleId: shouldBeSuperAdmin ? role.id : undefined,
      name: user.user_metadata?.name ?? user.email,
    },
    create: {
      authId: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? user.email,
      roleId: role.id,
    },
    include: { role: true },
  });
}

export async function requireAppUser() {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireAppUser();

  if (!can(user, permission)) {
    redirect("/admin?status=You%20do%20not%20have%20permission%20for%20that%20action");
  }

  return user;
}
