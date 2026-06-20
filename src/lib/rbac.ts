import type { Role } from "./data";

export const permissions: Record<Role, string[]> = {
  "Super Admin": [
    "Manage all leagues, seasons, teams, players, venues, users, roles, approvals, and audit logs",
  ],
  "League Admin": [
    "Create fixtures, manage league records, review team registrations, and prepare standings reports",
  ],
  "Team Admin": [
    "Update assigned team profile, maintain squad records, and upload team or player media",
  ],
  "Match Official/Data Entry": [
    "Submit scores, goal scorers, cards, substitutions, and match notes for assigned fixtures",
  ],
  "Public User": ["Browse public football data, fixtures, results, standings, teams, and player profiles"],
};

export function canEditStandings(role: Role) {
  return role === "Super Admin";
}

export function canSubmitResults(role: Role) {
  return role === "Super Admin" || role === "League Admin" || role === "Match Official/Data Entry";
}
