"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { updateSubmissionNotes } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { idleFormState } from "@/lib/validation/contact";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="navy" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save notes"}
    </Button>
  );
}

export function NotesForm({
  id,
  notes,
}: {
  id: string;
  notes: string | null;
}) {
  const [state, formAction] = useActionState(
    updateSubmissionNotes,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="admin-notes" className="sr-only">
        Internal notes
      </label>
      <Textarea
        id="admin-notes"
        name="notes"
        rows={5}
        defaultValue={notes ?? ""}
        placeholder="Internal notes: who picked this up, what was discussed, next step…"
        className="min-h-30 resize-y bg-white"
      />
      <div>
        <SaveButton />
      </div>
    </form>
  );
}
