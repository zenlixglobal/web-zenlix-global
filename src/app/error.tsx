"use client";

import { useEffect } from "react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Swap for your error reporter (Sentry, etc.) when you add one.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center bg-navy-900 text-white">
      <Container className="py-28">
        <p className="font-mono text-[12.5px] tracking-[0.14em] text-gold-500 uppercase">
          Something went wrong
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,5vw,2.5rem)] text-white">
          We hit an unexpected problem.
        </h1>
        <p className="mt-4 max-w-125 text-navy-fg">
          Please try again. If it keeps happening, get in touch and we&apos;ll
          look into it.
          {error.digest ? (
            <span className="mt-2 block font-mono text-xs text-navy-fg-subtle">
              Reference: {error.digest}
            </span>
          ) : null}
        </p>
        <div className="mt-8">
          <Button variant="gold" size="xl" onClick={reset}>
            Try again
          </Button>
        </div>
      </Container>
    </main>
  );
}
