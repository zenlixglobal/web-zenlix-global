"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNav, navCta } from "@/content/site";

/**
 * The original markup had a `.nav-toggle` hamburger but shipped no JavaScript
 * to open anything. This is the working version.
 */
export function MobileNav() {
  // Each link closes the drawer on click, which also covers same-page hash
  // links where the component never unmounts.
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Open menu"
          className="text-white hover:bg-white/10 hover:text-white md:hidden"
        >
          <MenuIcon className="size-6" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="dark w-[min(20rem,85vw)] border-l-white/14 bg-navy-900 p-0 text-white"
      >
        <SheetHeader className="border-b border-white/10 px-5 py-4 text-left">
          <SheetTitle asChild>
            <div>
              <Logo onNavigate={() => setOpen(false)} className="text-lg" />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col px-5 py-2">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-white/8 py-4 text-base font-medium text-navy-fg transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-5 pb-8">
          <Button asChild variant="gold" size="xl" className="w-full">
            <Link href={navCta.href} onClick={() => setOpen(false)}>
              {navCta.label}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
