import type { Metadata } from "next";

import { ContactForm } from "@/components/contact/contact-form";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Eyebrow } from "@/components/site/eyebrow";
import { PageBanner } from "@/components/site/page-banner";
import { contactDetails, contactPage } from "@/content/site";

export const metadata: Metadata = {
  title: "Get in Touch with Zenlix Global | Hire Talent & Submit Your Resume",
  description:
    "Get in touch with Zenlix Global to hire IT or Non-IT talent, start an executive search, or submit your resume.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageBanner
        eyebrow={contactPage.eyebrow}
        heading={contactPage.heading}
        intro={contactPage.intro}
      />

      <section
        id="contact"
        className="dark bg-navy-900 py-14 text-white sm:py-[70px] lg:pb-28"
      >
        <Stagger
          as="div"
          className="container-wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-[70px]"
        >
          <StaggerItem>
            <Eyebrow className="mb-3.5">{contactPage.formEyebrow}</Eyebrow>
            <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] text-white">
              {contactPage.formHeading}
            </h2>
            <p className="mt-3.5 text-navy-fg-muted">{contactPage.formIntro}</p>

            <ContactDetail label="Call Us Directly">
              <a
                href={`tel:${contactDetails.phone.replace(/[^\d+]/g, "")}`}
                className="transition-colors hover:text-gold-300"
              >
                {contactDetails.phone}
              </a>
            </ContactDetail>

            <ContactDetail label="Email Our Team">
              <a
                href={`mailto:${contactDetails.email.replace(/[[\]]/g, "")}`}
                className="break-all transition-colors hover:text-gold-300"
              >
                {contactDetails.email}
              </a>
            </ContactDetail>

            <ContactDetail label="Corporate Office">
              {contactDetails.addressLine1}
              <br />
              {contactDetails.addressLine2}
            </ContactDetail>

            <p className="mt-9 border-l-2 border-gold-500 bg-white/5 px-4 py-4 text-[13px] text-[#a9b3c4]">
              {contactPage.note}
            </p>
          </StaggerItem>

          <StaggerItem direction="left">
            <ContactForm />
          </StaggerItem>
        </Stagger>
      </section>
    </>
  );
}

function ContactDetail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-7">
      <h3 className="mb-2 font-mono text-[13px] tracking-[0.08em] text-gold-300 uppercase">
        {label}
      </h3>
      <p className="text-base text-[#dbe0ea]">{children}</p>
    </div>
  );
}
