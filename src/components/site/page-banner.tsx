import { Entrance, Reveal, StaggerItem } from "@/components/motion/reveal";
import { Eyebrow } from "@/components/site/eyebrow";
import { HeroMesh, navyGradient } from "@/components/site/navy-backdrop";
import { cn } from "@/lib/utils";

/** Ported from `.page-banner` — the navy header on /about and /contact. */
export function PageBanner({
  eyebrow,
  heading,
  intro,
  children,
}: {
  eyebrow: string;
  heading: string;
  intro?: string;
  /** Extra content under the heading, e.g. an article byline. */
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn("relative overflow-hidden text-white", navyGradient)}
    >
      <Reveal
        direction="none"
        delay={0.35}
        className="pointer-events-none absolute inset-0 hidden lg:block"
      >
        <HeroMesh className="size-full opacity-55" />
      </Reveal>

      {/* Above the fold on every page that uses it, so this cascades on mount
          like the home hero rather than waiting for a scroll that may never
          come on a short page. */}
      <Entrance
        as="div"
        className="container-wrap relative z-10 pt-28 pb-12 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-[70px]"
      >
        <StaggerItem>
          <Eyebrow className="mb-3.5">{eyebrow}</Eyebrow>
        </StaggerItem>
        <StaggerItem>
          <h1 className="text-[clamp(2rem,6vw,3rem)] text-white">{heading}</h1>
        </StaggerItem>
        {intro ? (
          <StaggerItem>
            <p className="mt-3.5 max-w-140 text-base text-navy-fg sm:text-[16.5px]">
              {intro}
            </p>
          </StaggerItem>
        ) : null}
        {children ? (
          <StaggerItem className="mt-3.5">{children}</StaggerItem>
        ) : null}
      </Entrance>
    </section>
  );
}
