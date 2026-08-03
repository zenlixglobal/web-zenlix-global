import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { PageBanner } from "@/components/site/page-banner";
import { LegalBody } from "@/components/site/legal-body";
import { contactDetails } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Zenlix Global collects, uses, and protects the personal information you share with us.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageBanner
        eyebrow="Legal"
        heading="Privacy Policy"
        intro="A placeholder outline. Have it reviewed by counsel before you publish."
      />
      <section className="py-14 sm:py-20">
        <Container>
          <LegalBody>
            <p>
              <strong>[Placeholder. Replace with your reviewed policy.]</strong>{" "}
              This page is a starting outline only and is not legal advice.
            </p>

            <h2>Information we collect</h2>
            <p>
              When you submit the contact form we collect your name, work email,
              phone number, company, inquiry type, and the message you write. If
              you subscribe to our newsletter we collect your email address.
            </p>

            <h2>How we use it</h2>
            <p>
              We use this information to respond to your enquiry, match
              candidates and clients, and, where you have opted in, send
              hiring insights. We do not sell your personal information.
            </p>

            <h2>Where it is stored</h2>
            <p>
              Submissions are stored in our Supabase database and copied to our
              team inbox by email. [Add your data-retention period here.]
            </p>

            <h2>Your rights</h2>
            <p>
              You can ask us to access, correct, or delete the information we
              hold about you. [Add the rights that apply in your jurisdiction:
              GDPR, CCPA, and so on.]
            </p>

            <h2>Contact</h2>
            <p>
              Questions about this policy? Email {contactDetails.email} or write
              to {contactDetails.addressShort}.
            </p>
          </LegalBody>
        </Container>
      </section>
    </>
  );
}
