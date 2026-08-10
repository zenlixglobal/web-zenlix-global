/**
 * The admin permission model.
 *
 * Two layers, and the split is the whole design:
 *
 *   1. **Role** — a preset, and the management hierarchy. Rank is what decides
 *      who may edit whom; it is not directly what unlocks a feature.
 *   2. **Capabilities** — the individual features. A role hands out a default
 *      set, and any of them can then be granted or revoked per person.
 *
 * So "Editor" is a starting point, not a cage: you can give one editor the
 * analytics page and take insights away from another, without inventing a new
 * role for each combination.
 *
 * Mirrors `supabase/migrations/0004_admin_roles.sql`. The database is the
 * boundary — this module decides what to *render* and gives server actions a
 * readable refusal. Both have to agree, or the UI lies about what will happen.
 *
 * No "server-only" import on purpose: the nav needs `can()` in the browser, and
 * there is nothing secret in a list of feature names.
 */

export const ADMIN_ROLES = ["owner", "admin", "editor", "viewer"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Must match `public.admin_role_rank()`. */
const RANK: Record<AdminRole, number> = {
  owner: 3,
  admin: 2,
  editor: 1,
  viewer: 0,
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  owner: "Every feature, always, plus full control of the team.",
  admin: "Manages editors and viewers. Feature access can be tuned.",
  editor: "Works enquiries and writes insights by default.",
  viewer: "Read-only by default.",
};

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export const CAPABILITIES = [
  "submissions:read",
  "submissions:write",
  "submissions:delete",
  "analytics:read",
  "insights:read",
  "insights:write",
  "insights:delete",
  "users:read",
  "users:manage",
  "audit:read",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  "submissions:read": "View enquiries",
  "submissions:write": "Update status and notes",
  "submissions:delete": "Delete enquiries",
  "analytics:read": "View analytics",
  "insights:read": "View articles and drafts",
  "insights:write": "Write and publish articles",
  "insights:delete": "Delete articles",
  "users:read": "View the team",
  "users:manage": "Add, re-role, and remove people",
  "audit:read": "View the activity log",
};

/**
 * Capabilities that another capability necessarily includes.
 *
 * Publishing an article you cannot read is not a coherent permission, so the
 * resolver closes over these rather than letting the UI offer a broken state.
 * Written "wider implies narrower" and applied transitively at resolve time,
 * so it holds no matter how the stored rows got there.
 */
const IMPLIES: Partial<Record<Capability, readonly Capability[]>> = {
  "submissions:write": ["submissions:read"],
  "submissions:delete": ["submissions:read", "submissions:write"],
  "insights:write": ["insights:read"],
  "insights:delete": ["insights:read", "insights:write"],
  // Managing people includes seeing the log of what was done to them — which
  // also makes Team a clean ladder rather than two independent switches.
  "users:manage": ["users:read", "audit:read"],
  "audit:read": ["users:read"],
};

/** What each role grants before any per-person adjustment. */
export const ROLE_DEFAULTS: Record<AdminRole, readonly Capability[]> = {
  // Owners are deliberately absolute: see `resolveCapabilities`.
  owner: CAPABILITIES,
  admin: CAPABILITIES,
  editor: [
    "submissions:read",
    "submissions:write",
    "analytics:read",
    "insights:read",
    "insights:write",
  ],
  viewer: ["submissions:read", "analytics:read", "insights:read"],
};

// ---------------------------------------------------------------------------
// Access levels
//
// The capability list is what the database enforces; this is how a human picks
// them. Each area is a ladder — every rung contains the one below it — so a
// single choice per area covers every combination the model can represent, and
// there is no way to select an incoherent one (delete without view).
//
// Adding a capability to an area means adding it to a rung here too, or it
// becomes unreachable from the UI.
// ---------------------------------------------------------------------------

export type AccessLevel = {
  id: string;
  label: string;
  /** Everything this rung grants, including the rungs below it. */
  capabilities: readonly Capability[];
};

export type AccessArea = {
  id: string;
  label: string;
  hint: string;
  levels: readonly AccessLevel[];
};

export const ACCESS_AREAS: readonly AccessArea[] = [
  {
    id: "enquiries",
    label: "Enquiries",
    hint: "Contact form submissions.",
    levels: [
      { id: "none", label: "No access", capabilities: [] },
      { id: "view", label: "View only", capabilities: ["submissions:read"] },
      {
        id: "write",
        label: "View & edit",
        capabilities: ["submissions:read", "submissions:write"],
      },
      {
        id: "full",
        label: "Full — edit & delete",
        capabilities: [
          "submissions:read",
          "submissions:write",
          "submissions:delete",
        ],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    hint: "Articles and drafts.",
    levels: [
      { id: "none", label: "No access", capabilities: [] },
      { id: "view", label: "View only", capabilities: ["insights:read"] },
      {
        id: "write",
        label: "View & write",
        capabilities: ["insights:read", "insights:write"],
      },
      {
        id: "full",
        label: "Full — write & delete",
        capabilities: ["insights:read", "insights:write", "insights:delete"],
      },
    ],
  },
  {
    // Nothing writes analytics from the admin — the data arrives from the
    // public tracker — so this area is genuinely two-state.
    id: "analytics",
    label: "Analytics",
    hint: "Traffic dashboard and live visitors.",
    levels: [
      { id: "none", label: "No access", capabilities: [] },
      { id: "view", label: "View only", capabilities: ["analytics:read"] },
    ],
  },
  {
    id: "team",
    label: "Team",
    hint: "Who can sign in to this admin.",
    levels: [
      { id: "none", label: "No access", capabilities: [] },
      { id: "view", label: "View only", capabilities: ["users:read"] },
      {
        id: "manage",
        label: "Manage people",
        capabilities: ["users:read", "users:manage", "audit:read"],
      },
    ],
  },
];

/** Every capability an area covers — the top rung, which contains the rest. */
export function areaCapabilities(area: AccessArea): readonly Capability[] {
  return area.levels[area.levels.length - 1].capabilities;
}

/**
 * The rung a held capability set sits on.
 *
 * Walks down from the top so the answer is the *highest* fully-satisfied rung.
 * Ladders are nested, so a partial set can only come from a hand-written SQL
 * row; it resolves to the highest rung it fully covers rather than throwing.
 */
export function levelOf(
  area: AccessArea,
  held: readonly Capability[],
): AccessLevel {
  for (let index = area.levels.length - 1; index >= 0; index -= 1) {
    const level = area.levels[index];
    if (level.capabilities.every((capability) => held.includes(capability))) {
      return level;
    }
  }
  return area.levels[0];
}

export function findLevel(
  area: AccessArea,
  levelId: string,
): AccessLevel | null {
  return area.levels.find((level) => level.id === levelId) ?? null;
}

export function findArea(areaId: string): AccessArea | null {
  return ACCESS_AREAS.find((area) => area.id === areaId) ?? null;
}

/** The highest rung `actor` can hand out — you cannot grant what you lack. */
export function grantableLevels(
  area: AccessArea,
  actor: { capabilities: readonly Capability[] },
): AccessLevel[] {
  return area.levels.filter((level) =>
    level.capabilities.every((capability) => can(actor, capability)),
  );
}

/** A per-person adjustment: `true` grants, `false` revokes. */
export type CapabilityOverride = { capability: Capability; granted: boolean };

/**
 * The effective feature set for one person.
 *
 * Owners short-circuit to everything. Revoking an owner's access to the team
 * page is the one change that could leave a project with no way to fix itself,
 * so the model refuses to represent it — enforced again by trigger in SQL.
 */
export function resolveCapabilities(
  role: AdminRole,
  overrides: readonly CapabilityOverride[] = [],
): Capability[] {
  if (role === "owner") return [...CAPABILITIES];

  const held = new Set<Capability>(ROLE_DEFAULTS[role]);

  for (const { capability, granted } of overrides) {
    if (granted) held.add(capability);
    else held.delete(capability);
  }

  // Close over implications until nothing new appears. The list is tiny and
  // shallow; a fixed point is simpler to reason about than an ordered pass.
  for (let changed = true; changed;) {
    changed = false;
    for (const capability of [...held]) {
      for (const implied of IMPLIES[capability] ?? []) {
        if (!held.has(implied)) {
          held.add(implied);
          changed = true;
        }
      }
    }
  }

  return CAPABILITIES.filter((capability) => held.has(capability));
}

/** Whether a resolved holder has a capability. */
export function can(
  holder: { capabilities: readonly Capability[] },
  capability: Capability,
): boolean {
  return holder.capabilities.includes(capability);
}

// ---------------------------------------------------------------------------
// Hierarchy
// ---------------------------------------------------------------------------

export function rankOf(role: AdminRole): number {
  return RANK[role];
}

/**
 * Whether `actor` may create, re-role, re-permission, or remove someone
 * holding `target`. Mirrors `public.can_manage_admin()`.
 *
 * Note this asks about the *role*, not a capability: `users:manage` says you
 * may manage people at all, and rank says which ones. An admin cannot touch a
 * peer even though both hold `users:manage`.
 */
export function canManageRole(
  actor: { role: AdminRole; capabilities: readonly Capability[] },
  target: AdminRole,
): boolean {
  if (!can(actor, "users:manage")) return false;
  if (actor.role === "owner") return true;
  return RANK[target] < RANK[actor.role];
}

/** The roles `actor` may hand out, for populating a role picker. */
export function assignableRoles(actor: {
  role: AdminRole;
  capabilities: readonly Capability[];
}): AdminRole[] {
  return ADMIN_ROLES.filter((role) => canManageRole(actor, role));
}

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

export function isCapability(value: unknown): value is Capability {
  return (
    typeof value === "string" &&
    (CAPABILITIES as readonly string[]).includes(value)
  );
}
