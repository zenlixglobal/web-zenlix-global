import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { HeroMesh, navyGradient } from "@/components/site/navy-backdrop";
import { cn } from "@/lib/utils";

/** Ported from `.page-banner` — the navy header on /about and /contact. */
export function PageBanner({
  eyebrow,
  heading,
  intro,
}: {
  eyebrow: string;
  heading: string;
  intro?: string;
}) {
  return (
    <section
      className={cn("relative overflow-hidden text-white", navyGradient)}
    >
      <HeroMesh className="pointer-events-none absolute inset-0 hidden size-full opacity-55 lg:block" />
      <Container className="relative z-10 pt-28 pb-12 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-[70px]">
        <Eyebrow className="mb-3.5">{eyebrow}</Eyebrow>
        <h1 className="text-[clamp(2rem,6vw,3rem)] text-white">{heading}</h1>
        {intro ? (
          <p className="mt-3.5 max-w-140 text-base text-navy-fg sm:text-[16.5px]">
            {intro}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
