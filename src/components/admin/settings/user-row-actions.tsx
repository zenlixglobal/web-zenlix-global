"use client";

import { useActionState, useEffect, useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import {
  removeAdminUser,
  setAdminDisabled,
  updateAdminRole,
} from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignableRoles,
  ROLE_LABELS,
  type AdminRole,
  type Capability,
} from "@/lib/permissions";
import { idleSettingsState, type SettingsFormState } from "@/lib/validation/settings";

/** Toasts whatever the action came back with, once per submission. */
function useActionToast(state: SettingsFormState) {
  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);
}

/**
 * Role picker that submits on change.
 *
 * Rendered read-only when the viewer cannot manage this person — showing a
 * disabled control is more honest than hiding the row's role entirely, and it
 * makes the hierarchy legible: you can see that someone is an owner, and see
 * that you cannot change it.
 */
export function RoleSelect({
  userId,
  role,
  actor,
  manageable,
}: {
  userId: string;
  role: AdminRole;
  actor: { role: AdminRole; capabilities: Capability[] };
  manageable: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateAdminRole,
    idleSettingsState,
  );

  useActionToast(state);

  const options = assignableRoles(actor);

  if (!manageable) {
    return (
      <span className="text-sm text-slate-muted">{ROLE_LABELS[role]}</span>
    );
  }

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="userId" value={userId} />
      <Select
        name="role"
        defaultValue={role}
        disabled={pending}
        onValueChange={(value) => {
          if (value === role) return;
          const data = new FormData();
          data.set("userId", userId);
          data.set("role", value);
          formAction(data);
        }}
      >
        <SelectTrigger size="sm" className="h-9 w-32 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((value) => (
            <SelectItem key={value} value={value}>
              {ROLE_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}

/**
 * Suspend / restore / revoke.
 *
 * Removal asks for confirmation in the client because it cannot be undone from
 * this screen — re-adding someone is a fresh invite. The server does not rely
 * on that confirmation for anything.
 */
export function UserRowMenu({
  userId,
  email,
  disabled,
}: {
  userId: string;
  email: string;
  disabled: boolean;
}) {
  const [disableState, disableAction] = useActionState(
    setAdminDisabled,
    idleSettingsState,
  );
  const [removeState, removeAction] = useActionState(
    removeAdminUser,
    idleSettingsState,
  );
  const [open, setOpen] = useState(false);

  useActionToast(disableState);
  useActionToast(removeState);

  function toggleDisabled() {
    const data = new FormData();
    data.set("userId", userId);
    data.set("disabled", disabled ? "false" : "true");
    disableAction(data);
    setOpen(false);
  }

  function remove() {
    const confirmed = window.confirm(
      `Remove admin access for ${email}?\n\nTheir Supabase login is kept, but they lose access to /admin immediately.`,
    );
    if (!confirmed) return;

    const data = new FormData();
    data.set("userId", userId);
    removeAction(data);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={`Actions for ${email}`}
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={(event) => event.preventDefault()} asChild>
          <button type="button" onClick={toggleDisabled} className="w-full">
            {disabled ? "Restore access" : "Suspend access"}
          </button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => event.preventDefault()}
          asChild
        >
          <button type="button" onClick={remove} className="w-full">
            Remove from team
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
