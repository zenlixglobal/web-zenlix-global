import { MailIcon, MapPinIcon, PhoneIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Container } from "@/components/site/container";
import { LogoMark } from "@/components/site/logo";
import { SocialIcon } from "@/components/site/social-icons";
import { activeSocialLinks, contactDetails, footer, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 pt-14 pb-8 text-[#8b95a8] sm:pt-[70px]">
      <Container>
        {/* A shorter throw than the page sections. The footer is the last
            thing anyone scrolls to and is often already half in view when it
            triggers, so a full-distance rise overshoots. */}
        <Stagger
          stagger={0.06}
          className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12"
        >
          <StaggerItem distance={14}>
            <div className="mb-4 flex items-center gap-2.5 font-heading text-xl text-white">
              <LogoMark size={32} className="size-8" />
              <span>{site.name}</span>
            </div>
            <p className="max-w-70 text-sm leading-[1.7]">{footer.tagline}</p>
          </StaggerItem>

          {footer.columns.map((column) => (
            <StaggerItem key={column.heading} distance={14}>
              <FooterHeading>{column.heading}</FooterHeading>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href} className="mb-3 text-sm">
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-gold-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}

          <StaggerItem distance={14}>
            <FooterHeading>Connect</FooterHeading>
            <ul className="text-sm">
              <ContactLine icon={MapPinIcon}>
                {contactDetails.addressShort}
              </ContactLine>
              <ContactLine icon={PhoneIcon}>{contactDetails.phone}</ContactLine>
              <ContactLine icon={MailIcon} className="break-all">
                {contactDetails.email}
              </ContactLine>
            </ul>

            {/* Renders only once a profile URL is filled in, so an unset row
                collapses instead of leaving a gap under the address. */}
            {activeSocialLinks.length > 0 ? (
              <ul className="mt-5 flex items-center gap-3">
                {activeSocialLinks.map((link) => (
                  <li key={link.platform}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.label}
                      className="flex size-9 items-center justify-center border border-white/12 transition-colors hover:border-gold-300/40 hover:text-gold-300"
                    >
                      <SocialIcon platform={link.platform} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </StaggerItem>

          {/* Legal sits last: it is the column people look for least, and the
              copyright line directly below it is the same kind of small print. */}
          <StaggerItem distance={14}>
            <FooterHeading>Legal</FooterHeading>
            <ul>
              {footer.legal.map((link) => (
                <li key={link.href} className="mb-3 text-sm">
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-gold-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>
        </Stagger>

        <Reveal
          distance={14}
          className="mt-12 border-t border-white/10 pt-6 text-[13px] sm:mt-15"
        >
          {/* The legal links moved up into their own column, so this row is
              the copyright alone rather than the same two links repeated a
              hundred pixels apart. */}
          <span>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </span>
        </Reveal>
      </Container>
    </footer>
  );
}

/**
 * One line of contact detail, icon in a fixed gutter.
 *
 * `items-start` rather than `items-center` because the address wraps to two
 * lines on narrow columns: centring would float the pin between them.
 */
function ContactLine({
  icon: Icon,
  className,
  children,
}: {
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="mb-3 flex items-start gap-2.5">
      {/* Nudged down to the first line's optical centre, not its box top. */}
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-300/70" />
      <span className={className}>{children}</span>
    </li>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="mb-[18px] font-mono text-xs tracking-[0.08em] text-white uppercase">
      {children}
    </h5>
  );
}
