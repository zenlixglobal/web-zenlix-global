import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Button } from "@/components/ui/button";
import { advantage } from "@/content/site";

/**
 * Shared by the home page (teaser + CTA to /about) and /about (full bullet
 * list). Pass `variant="full"` for the latter.
 */
export function Advantage({
  variant = "teaser",
  id,
}: {
  variant?: "teaser" | "full";
  id?: string;
}) {
  return (
    <section
      id={id}
      className="dark bg-navy-900 py-16 text-white sm:py-20 lg:py-28"
    >
      <Container className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-[70px]">
        <div className="relative">
          <div className="relative h-64 w-full sm:h-90 lg:h-105">
            <Image
              src={advantage.image.src}
              alt={advantage.image.alt}
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-0 bg-gold-500 px-5 py-4 font-heading text-navy-900 sm:px-[26px] sm:py-[22px] lg:-left-6">
            <b className="block text-2xl leading-none sm:text-3xl">
              {advantage.badge.value}
            </b>
            <span className="font-mono text-xs tracking-[0.06em] uppercase">
              {advantage.badge.label}
            </span>
          </div>
        </div>

        <div className="pt-8 lg:pt-0">
          <Eyebrow className="mb-3.5">{advantage.eyebrow}</Eyebrow>
          <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.15] text-white">
            {advantage.heading}
          </h2>
          <p className="mt-4 text-base text-navy-fg-muted">{advantage.body}</p>

          {variant === "full" ? (
            <ol className="mt-7">
              {advantage.points.map((point, index) => (
                <li
                  key={point}
                  className="flex gap-4 border-t border-white/14 py-4 text-[15px] text-navy-fg last:border-b sm:text-[15.5px]"
                >
                  <span className="w-6.5 shrink-0 font-mono text-[13px] text-gold-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-7">
              <Button asChild variant="outline-light" size="xl">
                <Link href="/about">
                  Learn About Our Firm <span aria-hidden>&rarr;</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
