import Link from "next/link";

import { Container } from "@/components/site/container";
import { navyGradient } from "@/components/site/navy-backdrop";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className={cn("flex-1 text-white", navyGradient)}>
        <Container className="flex min-h-[70vh] flex-col justify-center py-28">
          <p className="font-mono text-[12.5px] tracking-[0.14em] text-gold-500 uppercase">
            404
          </p>
          <h1 className="mt-3 text-[clamp(2rem,6vw,3rem)] text-white">
            We couldn&apos;t find that page.
          </h1>
          <p className="mt-4 max-w-125 text-navy-fg">
            The link may be out of date. Head back to the homepage, or tell us
            what you were looking for.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="gold" size="xl">
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild variant="outline-light" size="xl">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
