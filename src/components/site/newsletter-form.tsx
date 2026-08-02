"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { subscribeToNewsletter } from "@/app/actions/contact";
import { footer } from "@/content/site";
import { trackEvent } from "@/lib/analytics/client";
import { idleFormState } from "@/lib/validation/contact";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 bg-gold-500 px-4 text-sm font-bold text-navy-900 transition-colors hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 disabled:opacity-60 sm:px-[18px]"
    >
      {pending ? "…" : footer.newsletter.cta}
    </button>
  );
}

/**
 * Replaces the original footer input, whose button only ran
 * `alert('Connect this form to an email service before publishing.')`.
 * Subscribers land in the `newsletter_subscribers` table.
 */
export function NewsletterForm() {
  const [state, formAction] = useActionState(
    subscribeToNewsletter,
    idleFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      trackEvent("newsletter_subscribed");
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-4">
      <div className="flex border border-white/16 focus-within:border-gold-500">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={footer.newsletter.placeholder}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[13.5px] text-white placeholder:text-[#7c869a] focus:outline-none"
        />
        <SubmitButton />
      </div>
      <p
        aria-live="polite"
        className={
          state.status === "idle"
            ? "sr-only"
            : "mt-2 text-[13px] text-navy-fg-subtle"
        }
      >
        {state.message}
      </p>
    </form>
  );
}
