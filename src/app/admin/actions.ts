"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUBMISSION_STATUSES } from "@/lib/supabase/types";
import type { FormState } from "@/lib/validation/contact";

const updateStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(SUBMISSION_STATUSES),
});

/**
 * Server Actions are public HTTP endpoints, so each one re-checks the caller.
 * The write itself also goes through the session client, so RLS is the
 * backstop if this check is ever removed.
 */
export async function updateSubmissionStatus(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = updateStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid status update." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("contact_submissions")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[admin] status update failed", error);
    return { status: "error", message: "Could not update the status." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/submissions/${parsed.data.id}`);

  return { status: "success", message: "Status updated." };
}

const notesSchema = z.object({
  id: z.uuid(),
  notes: z.string().max(5000, "Notes are too long"),
});

export async function updateSubmissionNotes(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = notesSchema.safeParse({
    id: formData.get("id"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", message: "Notes are too long (5000 max)." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("contact_submissions")
    .update({ admin_notes: parsed.data.notes || null })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[admin] notes update failed", error);
    return { status: "error", message: "Could not save your notes." };
  }

  revalidatePath(`/admin/submissions/${parsed.data.id}`);

  return { status: "success", message: "Notes saved." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
