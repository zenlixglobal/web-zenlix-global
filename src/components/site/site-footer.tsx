import Link from "next/link";

import { Container } from "@/components/site/container";
import { LogoMark } from "@/components/site/logo";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { contactDetails, footer, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 pt-14 pb-8 text-[#8b95a8] sm:pt-[70px]">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12">
          <div>
            <div className="mb-4 flex items-center gap-2.5 font-heading text-xl text-white">
              <LogoMark size={32} className="size-8" />
              <span>{site.name}</span>
            </div>
            <p className="max-w-70 text-sm leading-[1.7]">{footer.tagline}</p>
          </div>

          {footer.columns.map((column) => (
            <div key={column.heading}>
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
            </div>
          ))}

          <div>
            <FooterHeading>Connect</FooterHeading>
            <ul className="text-sm">
              <li className="mb-3">{contactDetails.addressShort}</li>
              <li className="mb-3">{contactDetails.phone}</li>
              <li className="mb-3 break-all">{contactDetails.email}</li>
            </ul>
          </div>

          <div>
            <FooterHeading>{footer.newsletter.heading}</FooterHeading>
            <p className="max-w-70 text-sm leading-[1.7]">
              {footer.newsletter.body}
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3.5 border-t border-white/10 pt-6 text-[13px] sm:mt-15 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </span>
          <span className="flex flex-wrap gap-x-6 gap-y-2">
            {footer.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-gold-300"
              >
                {link.label}
              </Link>
            ))}
          </span>
        </div>
      </Container>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="mb-[18px] font-mono text-xs tracking-[0.08em] text-white uppercase">
      {children}
    </h5>
  );
}
