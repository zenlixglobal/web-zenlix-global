import Image from "next/image";
import Link from "next/link";

import { CountUp } from "@/components/motion/count-up";
import { Entrance, Reveal, StaggerItem } from "@/components/motion/reveal";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { HeroMesh, navyGradient } from "@/components/site/navy-backdrop";
import { Button } from "@/components/ui/button";
import { hero } from "@/content/site";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      id="home"
      className={cn("relative overflow-hidden text-white", navyGradient)}
    >
      {/* Only shown in the two-column layout it was drawn for — in the stacked
          layout its lines run straight through the headline. */}
      {/* Faded in last and slowly: it is scenery, and racing it against the
          headline makes the whole hero feel busy. */}
      <Reveal
        direction="none"
        delay={0.35}
        className="pointer-events-none absolute inset-0 hidden lg:block"
      >
        <HeroMesh className="size-full opacity-55" />
      </Reveal>

      {/* The hero is above the fold, so it animates on mount rather than on
          scroll — a `whileInView` trigger here would either fire in the same
          frame as the paint or, on a tall viewport, never read as an entrance
          at all. Every <StaggerItem> below inherits its timing from here, even
          the ones nested inside plain server-rendered elements. */}
      <Entrance>
        <Container className="relative z-10 grid items-center gap-10 pt-28 pb-16 sm:pt-36 sm:pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-15 lg:pt-45 lg:pb-30">
          {/* Panel sits first on small screens, mirroring `.hero-panel { order:-1 }`. */}
          <div className="order-2 lg:order-1">
            <StaggerItem>
              <Eyebrow className="mb-3.5">{hero.eyebrow}</Eyebrow>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-[clamp(2.125rem,7vw,3.75rem)] leading-[1.08] text-white">
                {hero.headline}{" "}
                <em className="font-medium text-gold-300 italic">
                  {hero.headlineAccent}
                </em>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="mt-6 max-w-130 text-base text-navy-fg sm:text-lg">
                {hero.lede}
              </p>
            </StaggerItem>

            <StaggerItem className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button asChild variant="gold" size="xl">
                <Link href={hero.primaryCta.href}>
                  {hero.primaryCta.label} <span aria-hidden>&rarr;</span>
                </Link>
              </Button>
            </StaggerItem>

            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:flex sm:gap-14 lg:mt-16">
              {hero.stats.map((stat) => (
                <StaggerItem key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <CountUp
                      value={stat.value}
                      className="block font-heading text-3xl font-semibold text-gold-300 sm:text-[40px]"
                    />
                    <span className="font-mono text-[15px] tracking-[0.03em] text-[#a9b3c4]">
                      {stat.label}
                    </span>
                  </dd>
                </StaggerItem>
              ))}
            </dl>
          </div>

          <StaggerItem
            direction="left"
            className="order-1 border border-white/14 bg-white/4 p-6 supports-[backdrop-filter]:backdrop-blur-[4px] sm:p-8 lg:order-2"
          >
            <div className="relative mb-5 h-45 w-full sm:h-[210px]">
              <Image
                src={hero.panel.image.src}
                alt={hero.panel.image.alt}
                fill
                priority
                sizes="(min-width: 1024px) 380px, 100vw"
                className="object-cover"
              />
            </div>
            <p className="mb-2 font-mono text-xs tracking-[0.08em] text-gold-300 uppercase">
              {hero.panel.caption}
            </p>
            <p className="text-sm text-navy-fg sm:text-[14.5px]">
              {hero.panel.body}
            </p>
          </StaggerItem>
        </Container>
      </Entrance>
    </section>
  );
}
