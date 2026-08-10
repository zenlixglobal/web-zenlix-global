"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { setAreaAccess } from "@/app/admin/settings/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCESS_AREAS,
  grantableLevels,
  levelOf,
  resolveCapabilities,
  ROLE_LABELS,
  type AccessArea,
  type AdminRole,
  type Capability,
  type CapabilityOverride,
} from "@/lib/permissions";
import { idleSettingsState } from "@/lib/validation/settings";

/**
 * Per-area access for one person: one dropdown each for Enquiries, Insights,
 * Analytics, and Team.
 *
 * A level is just a named set of capabilities, and every area is a ladder —
 * each rung contains the one below — so these four selects can express every
 * state the permission model can hold, and none of the incoherent ones. That
 * is why this replaced a grid of ten checkboxes rather than sitting beside it:
 * "delete but not view" was never a state worth being able to click.
 *
 * The role beside the person's name is a preset. Choosing a level that matches
 * what their role already gives clears the override, so they go back to
 * tracking the preset rather than being pinned to today's meaning of it.
 */
export function PermissionEditor({
  userId,
  role,
  overrides,
  actor,
}: {
  userId: string;
  role: AdminRole;
  overrides: CapabilityOverride[];
  actor: { role: AdminRole; capabilities: Capability[] };
}) {
  const [state, formAction, pending] = useActionState(
    setAreaAccess,
    idleSettingsState,
  );

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  // Owners are absolute by construction; there is nothing to choose.
  if (role === "owner") {
    return (
      <p className="text-sm text-slate-muted">
        Owners always have every feature. Change the role to limit access.
      </p>
    );
  }

  const effective = resolveCapabilities(role, overrides);
  const fromRole = resolveCapabilities(role);

  function submit(area: AccessArea, levelId: string) {
    const data = new FormData();
    data.set("userId", userId);
    data.set("area", area.id);
    data.set("level", levelId);
    formAction(data);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ACCESS_AREAS.map((area) => {
        const current = levelOf(area, effective);
        const preset = levelOf(area, fromRole);
        // You cannot hand out what you do not hold, so rungs above the actor's
        // own access are dropped rather than offered and then refused.
        const options = grantableLevels(area, actor);
        const unreachable = !options.some((level) => level.id === current.id);

        return (
          <div key={area.id}>
            <label
              htmlFor={`${userId}-${area.id}`}
              className="block text-sm font-medium"
            >
              {area.label}
            </label>
            <p className="mt-0.5 mb-2 text-[11px] text-slate-muted">
              {area.hint}
            </p>

            <Select
              value={current.id}
              disabled={pending || unreachable}
              onValueChange={(value) => {
                if (value !== current.id) submit(area, value);
              }}
            >
              <SelectTrigger
                id={`${userId}-${area.id}`}
                size="sm"
                className="h-9 w-full bg-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.label}
                  </SelectItem>
                ))}
                {/* Keeps the trigger readable when the current level is one the
                    actor cannot re-grant; the control is disabled anyway. */}
                {unreachable ? (
                  <SelectItem value={current.id} disabled>
                    {current.label}
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>

            <p className="mt-1 text-[11px] text-slate-muted">
              {current.id === preset.id
                ? `From ${ROLE_LABELS[role]}`
                : `Set individually · ${ROLE_LABELS[role]} gives ${preset.label.toLowerCase()}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
