import Link from "next/link";

import { Container } from "@/components/site/container";
import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { mainNav, navCta } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/14 bg-navy-900/92 supports-[backdrop-filter]:backdrop-blur-[10px]">
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-[78px]">
        <Logo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-6 lg:gap-9">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group relative pb-1 text-[14.5px] font-medium text-[#cfd6e2] transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
                >
                  {item.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gold-500 transition-transform duration-250 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Button
          asChild
          variant="outline"
          className="hidden h-11 border-gold-500 bg-transparent px-6 text-[13.5px] font-semibold text-gold-300 hover:bg-gold-500 hover:text-navy-900 md:inline-flex"
        >
          <Link href={navCta.href}>{navCta.label}</Link>
        </Button>

        <MobileNav />
      </Container>
    </header>
  );
}
