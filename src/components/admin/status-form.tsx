"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateSubmissionStatus } from "@/app/admin/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_LABELS,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from "@/lib/supabase/types";
import { idleFormState } from "@/lib/validation/contact";

/** Status dropdown that submits the moment a new value is chosen. */
export function StatusForm({
  id,
  status,
}: {
  id: string;
  status: SubmissionStatus;
}) {
  const [state, formAction] = useActionState(
    updateSubmissionStatus,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="id" value={id} />
      <Select
        name="status"
        defaultValue={status}
        onValueChange={(value) => {
          const data = new FormData();
          data.set("id", id);
          data.set("status", value);
          formAction(data);
        }}
      >
        <SelectTrigger size="sm" className="h-9 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUBMISSION_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
