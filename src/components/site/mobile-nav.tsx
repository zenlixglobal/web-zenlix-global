"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { revealVariants, staggerVariants } from "@/components/motion/tokens";
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
import { cn } from "@/lib/utils";

/**
 * The original markup had a `.nav-toggle` hamburger but shipped no JavaScript
 * to open anything. This is the working version.
 */
export function MobileNav({ className }: { className?: string }) {
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
          className={cn(
            "text-white hover:bg-white/10 hover:text-white md:hidden",
            className,
          )}
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
              <Logo
                onNavigate={() => setOpen(false)}
                className="text-lg"
                markClassName="size-9"
              />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>

        {/* Radix mounts the panel's contents on open and unmounts them on
            close, so `animate` replays every time the drawer is opened —
            no exit choreography or open-state plumbing needed here.
            `delayChildren` waits out the panel's own slide-in so the links
            are not travelling while the drawer still is. */}
        <motion.nav
          className="flex flex-col px-5 py-2"
          variants={staggerVariants(0.05, 0.15)}
          initial="hidden"
          animate="visible"
        >
          {mainNav.map((item) => (
            <motion.div key={item.href} variants={revealVariants("left", 16)}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block border-b border-white/8 py-4 text-base font-medium text-navy-fg transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}

          <motion.div
            variants={revealVariants("left", 16)}
            className="px-0 pt-6 pb-8"
          >
            <Button asChild variant="gold" size="xl" className="w-full">
              <Link href={navCta.href} onClick={() => setOpen(false)}>
                {navCta.label}
              </Link>
            </Button>
          </motion.div>
        </motion.nav>
      </SheetContent>
    </Sheet>
  );
}
