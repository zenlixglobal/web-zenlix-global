"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { updateProfile } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleSettingsState } from "@/lib/validation/settings";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="navy" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save profile"}
    </Button>
  );
}

/** The one thing every admin, whatever their role, can change about themselves. */
export function ProfileForm({ fullName }: { fullName: string | null }) {
  const [state, formAction] = useActionState(updateProfile, idleSettingsState);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid max-w-md gap-5">
      <Field data-invalid={Boolean(state.fieldErrors?.fullName) || undefined}>
        <FieldLabel htmlFor="fullName">Display name</FieldLabel>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={fullName ?? ""}
          autoComplete="name"
          maxLength={120}
          required
          className="h-11 bg-white"
          aria-invalid={Boolean(state.fieldErrors?.fullName) || undefined}
        />
        {state.fieldErrors?.fullName ? (
          <FieldError
            errors={state.fieldErrors.fullName.map((message) => ({ message }))}
          />
        ) : null}
      </Field>

      <div>
        <SaveButton />
      </div>
    </form>
  );
}
