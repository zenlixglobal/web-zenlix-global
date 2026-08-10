"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { changePassword } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleSettingsState } from "@/lib/validation/settings";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="navy" size="lg" disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(changePassword, idleSettingsState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      // Passwords are never echoed back on failure, so the only case worth
      // clearing is the successful one — leaving three filled password boxes
      // on screen afterwards is both confusing and worth avoiding.
      formRef.current?.reset();
    }
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  const errorFor = (name: string) => state.fieldErrors?.[name];

  return (
    <form ref={formRef} action={formAction} className="grid max-w-md gap-5">
      <Field data-invalid={Boolean(errorFor("currentPassword")) || undefined}>
        <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 bg-white"
          aria-invalid={Boolean(errorFor("currentPassword")) || undefined}
        />
        {errorFor("currentPassword") ? (
          <FieldError
            errors={errorFor("currentPassword")?.map((message) => ({ message }))}
          />
        ) : null}
      </Field>

      <Field data-invalid={Boolean(errorFor("newPassword")) || undefined}>
        <FieldLabel htmlFor="newPassword">New password</FieldLabel>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className="h-11 bg-white"
          aria-invalid={Boolean(errorFor("newPassword")) || undefined}
        />
        <FieldDescription>
          At least 10 characters. This account can read every enquiry the site
          has ever taken — use something you don&rsquo;t use elsewhere.
        </FieldDescription>
        {errorFor("newPassword") ? (
          <FieldError
            errors={errorFor("newPassword")?.map((message) => ({ message }))}
          />
        ) : null}
      </Field>

      <Field data-invalid={Boolean(errorFor("confirmPassword")) || undefined}>
        <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="h-11 bg-white"
          aria-invalid={Boolean(errorFor("confirmPassword")) || undefined}
        />
        {errorFor("confirmPassword") ? (
          <FieldError
            errors={errorFor("confirmPassword")?.map((message) => ({ message }))}
          />
        ) : null}
      </Field>

      <div>
        <SaveButton />
      </div>
    </form>
  );
}
