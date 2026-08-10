"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon, CopyIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";

import { inviteAdminUser } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignableRoles,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type AdminRole,
  type Capability,
} from "@/lib/permissions";
import { idleSettingsState } from "@/lib/validation/settings";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="navy"
      size="lg"
      disabled={pending}
      className="gap-2"
    >
      <UserPlusIcon className="size-4" />
      {pending ? "Adding…" : "Add to team"}
    </Button>
  );
}

/**
 * Adds a teammate.
 *
 * The role picker only lists roles the current user may actually grant, so an
 * admin never sees "Owner" as an option to be refused after the fact. The
 * server re-derives that list from the session regardless.
 */
export function InviteForm({
  actor,
}: {
  actor: { role: AdminRole; capabilities: Capability[] };
}) {
  const [state, formAction] = useActionState(inviteAdminUser, idleSettingsState);
  const formRef = useRef<HTMLFormElement>(null);
  const roles = assignableRoles(actor);
  const defaultRole = roles.includes("viewer") ? "viewer" : roles[0];

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    }
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  const errorFor = (name: string) => state.fieldErrors?.[name];

  return (
    <div className="border border-line bg-white p-5 sm:p-6">
      <h2 className="text-lg">Add a team member</h2>
      <p className="mt-1 mb-5 text-sm text-slate-muted">
        If the email already has a Zenlix login, this grants that account access
        instead of creating a second one.
      </p>

      <form
        ref={formRef}
        action={formAction}
        className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
      >
        <Field data-invalid={Boolean(errorFor("email")) || undefined}>
          <FieldLabel htmlFor="invite-email">Email</FieldLabel>
          <Input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="off"
            required
            placeholder="name@zenlixglobal.com"
            className="h-11"
            aria-invalid={Boolean(errorFor("email")) || undefined}
          />
          {errorFor("email") ? (
            <FieldError
              errors={errorFor("email")?.map((message) => ({ message }))}
            />
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="invite-name">Name</FieldLabel>
          <Input
            id="invite-name"
            name="fullName"
            autoComplete="off"
            maxLength={120}
            placeholder="Optional"
            className="h-11"
          />
        </Field>

        <Field
          className="sm:w-44"
          data-invalid={Boolean(errorFor("role")) || undefined}
        >
          <FieldLabel htmlFor="invite-role">Role</FieldLabel>
          <Select name="role" defaultValue={defaultRole}>
            <SelectTrigger id="invite-role" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorFor("role") ? (
            <FieldError
              errors={errorFor("role")?.map((message) => ({ message }))}
            />
          ) : null}
        </Field>

        <div className="sm:col-span-3">
          <SubmitButton />
          <FieldDescription className="mt-3">
            {roles
              .map((role) => `${ROLE_LABELS[role]} — ${ROLE_DESCRIPTIONS[role]}`)
              .join("  ·  ")}
          </FieldDescription>
        </div>
      </form>

      {state.temporaryPassword ? (
        <TemporaryPassword password={state.temporaryPassword} />
      ) : null}
    </div>
  );
}

/**
 * The one and only time this password is visible.
 *
 * It is not stored anywhere — not in the database, not in the audit log — so
 * losing it means resetting the account rather than looking it up. The copy
 * button exists because retyping it wrongly is the likeliest way that happens.
 */
function TemporaryPassword({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      toast.error("Could not copy — select the password and copy it manually.");
    }
  }

  return (
    <div className="mt-6 border border-gold-500/40 bg-gold-500/8 p-4">
      <p className="text-sm font-medium text-navy-900">
        Temporary password — shown once
      </p>
      <p className="mt-1 text-sm text-slate-muted">
        Send this to them over a channel you trust, and have them change it in
        Settings → Profile after their first sign-in.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="border border-line bg-white px-3 py-2 font-mono text-sm break-all">
          {password}
        </code>
        <Button type="button" variant="outline" size="lg" onClick={copy}>
          {copied ? (
            <CheckIcon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
