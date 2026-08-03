import Image from "next/image";
import Link from "next/link";

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
      <HeroMesh className="pointer-events-none absolute inset-0 hidden size-full opacity-55 lg:block" />

      <Container className="relative z-10 grid items-center gap-10 pt-28 pb-16 sm:pt-36 sm:pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-15 lg:pt-45 lg:pb-30">
        {/* Panel sits first on small screens, mirroring `.hero-panel { order:-1 }`. */}
        <div className="order-2 lg:order-1">
          {/* sm: repeated on purpose — the base class carries its own
              sm:text-[12.5px], which would otherwise win above 640px. */}
          <Eyebrow className="mb-3.5 text-[20px] font-bold sm:text-[20px]">
            {hero.eyebrow}
          </Eyebrow>

          <h1 className="text-[clamp(2.125rem,7vw,3.75rem)] leading-[1.08] text-white">
            {hero.headline}{" "}
            <em className="font-medium text-gold-300 italic">
              {hero.headlineAccent}
            </em>
          </h1>

          <p className="mt-6 max-w-130 text-base text-navy-fg sm:text-lg">
            {hero.lede}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button asChild variant="gold" size="xl">
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label} <span aria-hidden>&rarr;</span>
              </Link>
            </Button>
            <Button asChild variant="outline-light" size="xl">
              <Link href={hero.secondaryCta.href}>
                {hero.secondaryCta.label}
              </Link>
            </Button>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:flex sm:gap-14 lg:mt-16">
            {hero.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-heading text-3xl font-semibold text-gold-300 sm:text-[40px]">
                    {stat.value}
                  </span>
                  <span className="font-mono text-[15px] tracking-[0.03em] text-[#a9b3c4] sm:text-[17px]">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-1 border border-white/14 bg-white/4 p-6 supports-[backdrop-filter]:backdrop-blur-[4px] sm:p-8 lg:order-2">
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
        </div>
      </Container>
    </section>
  );
}
