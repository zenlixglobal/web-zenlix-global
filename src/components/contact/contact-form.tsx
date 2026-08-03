"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { submitContactForm } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inquiryGroups, legalDetails, site } from "@/content/site";
import { trackEvent } from "@/lib/analytics/client";
import { idleFormState } from "@/lib/validation/contact";

const labelClass =
  "font-mono text-[12.5px] tracking-[0.03em] text-[#a9b3c4] uppercase";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="gold"
      size="xl"
      disabled={pending}
      className="w-full justify-center"
    >
      {pending ? "Sending…" : "Submit Inquiry"}
    </Button>
  );
}

/**
 * The original form only ran `alert('This form is a placeholder…')`.
 *
 * This version posts to a Server Action which validates with the same zod
 * schema, writes to Supabase, then emails the team. Errors come back per
 * field so nothing is lost if validation fails.
 */
export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  // React 19 resets an uncontrolled `<form action={fn}>` once the action
  // settles — including when it failed validation. The action echoes the
  // submitted strings back, and keying the inputs on `attempt` remounts them
  // with those values, so a rejected submit never costs the visitor their
  // typing. On success `values` is absent, so the form comes back empty.
  const values = state.values;
  const attempt = state.attempt ?? 0;

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      // Marks the analytics session as converted, which is what turns raw
      // traffic into a conversion rate on the admin dashboard.
      trackEvent("contact_submitted");
    } else if (state.status === "error") {
      toast.error(state.message);
      // Worth recording separately: a spike here means the form is failing,
      // not that nobody is interested.
      trackEvent("contact_failed");
    }
  }, [state]);

  const errorFor = (field: string) => state.fieldErrors?.[field];

  // Send focus to the first field that failed, so the visitor is taken to the
  // problem instead of hunting for the red text.
  useEffect(() => {
    if (state.status !== "error" || !state.fieldErrors) return;

    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      "[aria-invalid='true']",
    );
    firstInvalid?.focus({ preventScroll: true });
    firstInvalid?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      // Inputs are sized up from the shadcn default (32px) so every control
      // clears the 44px minimum touch target on a phone.
      className="grid gap-5 [&_input]:h-12 [&_input]:px-3.5 [&_textarea]:px-3.5 [&_textarea]:py-3 sm:grid-cols-2"
    >
      {/* Honeypot — hidden from people and assistive tech, irresistible to bots. */}
      <div aria-hidden className="hidden">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input
          id={`${uid}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Field data-invalid={Boolean(errorFor("firstName")) || undefined}>
        <FieldLabel htmlFor={`${uid}-firstName`} className={labelClass}>
          First Name *
        </FieldLabel>
        <Input
          key={`firstName-${attempt}`}
          id={`${uid}-firstName`}
          name="firstName"
          defaultValue={values?.firstName ?? ""}
          autoComplete="given-name"
          placeholder="Jane"
          required
          aria-invalid={Boolean(errorFor("firstName")) || undefined}
        />
        <FieldError errors={errorFor("firstName")?.map((m) => ({ message: m }))} />
      </Field>

      <Field data-invalid={Boolean(errorFor("lastName")) || undefined}>
        <FieldLabel htmlFor={`${uid}-lastName`} className={labelClass}>
          Last Name *
        </FieldLabel>
        <Input
          key={`lastName-${attempt}`}
          id={`${uid}-lastName`}
          name="lastName"
          defaultValue={values?.lastName ?? ""}
          autoComplete="family-name"
          placeholder="Doe"
          required
          aria-invalid={Boolean(errorFor("lastName")) || undefined}
        />
        <FieldError errors={errorFor("lastName")?.map((m) => ({ message: m }))} />
      </Field>

      <Field data-invalid={Boolean(errorFor("email")) || undefined}>
        <FieldLabel htmlFor={`${uid}-email`} className={labelClass}>
          Work Email *
        </FieldLabel>
        <Input
          key={`email-${attempt}`}
          id={`${uid}-email`}
          name="email"
          defaultValue={values?.email ?? ""}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="jane@company.com"
          required
          aria-invalid={Boolean(errorFor("email")) || undefined}
        />
        <FieldError errors={errorFor("email")?.map((m) => ({ message: m }))} />
      </Field>

      <Field data-invalid={Boolean(errorFor("phone")) || undefined}>
        <FieldLabel htmlFor={`${uid}-phone`} className={labelClass}>
          Direct Phone *
        </FieldLabel>
        <Input
          key={`phone-${attempt}`}
          id={`${uid}-phone`}
          name="phone"
          defaultValue={values?.phone ?? ""}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(000) 000-0000"
          required
          aria-invalid={Boolean(errorFor("phone")) || undefined}
        />
        <FieldError errors={errorFor("phone")?.map((m) => ({ message: m }))} />
      </Field>

      <Field
        className="sm:col-span-2"
        data-invalid={Boolean(errorFor("company")) || undefined}
      >
        <FieldLabel htmlFor={`${uid}-company`} className={labelClass}>
          Company Name *
        </FieldLabel>
        <Input
          key={`company-${attempt}`}
          id={`${uid}-company`}
          name="company"
          defaultValue={values?.company ?? ""}
          autoComplete="organization"
          placeholder="Company Inc."
          required
          aria-invalid={Boolean(errorFor("company")) || undefined}
        />
        <FieldError errors={errorFor("company")?.map((m) => ({ message: m }))} />
      </Field>

      <Field
        className="sm:col-span-2"
        data-invalid={Boolean(errorFor("inquiryType")) || undefined}
      >
        <FieldLabel htmlFor={`${uid}-inquiryType`} className={labelClass}>
          Inquiry Type *
        </FieldLabel>
        {/* Radix renders a hidden native control for `name`, so this still
            arrives in the FormData the Server Action receives. */}
        {/* Radix needs `undefined`, not "", to show its placeholder. */}
        <Select
          key={`inquiryType-${attempt}`}
          name="inquiryType"
          required
          defaultValue={values?.inquiryType || undefined}
        >
          <SelectTrigger
            id={`${uid}-inquiryType`}
            className="h-12 w-full"
            aria-invalid={Boolean(errorFor("inquiryType")) || undefined}
          >
            <SelectValue placeholder="Select an inquiry type..." />
          </SelectTrigger>
          <SelectContent>
            {inquiryGroups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <FieldError
          errors={errorFor("inquiryType")?.map((m) => ({ message: m }))}
        />
      </Field>

      <Field
        className="sm:col-span-2"
        data-invalid={Boolean(errorFor("message")) || undefined}
      >
        <FieldLabel htmlFor={`${uid}-message`} className={labelClass}>
          How can we help? *
        </FieldLabel>
        <Textarea
          key={`message-${attempt}`}
          id={`${uid}-message`}
          name="message"
          defaultValue={values?.message ?? ""}
          rows={5}
          placeholder="Tell us a bit about your hiring need or role..."
          required
          className="min-h-27.5 resize-y"
          aria-invalid={Boolean(errorFor("message")) || undefined}
        />
        <FieldError errors={errorFor("message")?.map((m) => ({ message: m }))} />
      </Field>

      <div className="mt-1.5 sm:col-span-2">
        {/* TCPA consent has to be immediately above the button that gives it,
            and has to name who the calls and texts will actually come from —
            the same disclosure carriers ask for at A2P registration. It is
            deliberately not a checkbox: consent to be contacted about your own
            inquiry is the point of submitting the form. */}
        <p className="mb-4 text-[12.5px] leading-relaxed text-navy-fg-muted">
          By submitting this form you agree that {site.name} and{" "}
          {legalDetails.messagingPartner}, acting on our behalf, may contact you
          about your inquiry at the email address and phone number you provided,
          including by autodialed calls and text messages. Consent is not a
          condition of being considered for any role or service. Message
          frequency varies, and message and data rates may apply; reply STOP to
          opt out. See our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-2 hover:text-gold-300"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-gold-300"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <SubmitButton />
        <p
          aria-live="polite"
          className={
            state.status === "idle"
              ? "sr-only"
              : "mt-3 text-sm text-navy-fg-subtle"
          }
        >
          {state.message}
        </p>
      </div>
    </form>
  );
}
