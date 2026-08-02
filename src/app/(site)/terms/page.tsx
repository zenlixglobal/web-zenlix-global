import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { LegalBody } from "@/components/site/legal-body";
import { PageBanner } from "@/components/site/page-banner";
import { contactDetails } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of the Zenlix Global website and services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageBanner
        eyebrow="Legal"
        heading="Terms of Service"
        intro="A placeholder outline. Have it reviewed by counsel before you publish."
      />
      <section className="py-14 sm:py-20">
        <Container>
          <LegalBody>
            <p>
              <strong>[Placeholder — replace with your reviewed terms.]</strong>{" "}
              This page is a starting outline only and is not legal advice.
            </p>

            <h2>Using this site</h2>
            <p>
              By accessing this website you agree to use it lawfully and not to
              interfere with its operation or attempt to access areas you are
              not authorised to reach.
            </p>

            <h2>Submissions</h2>
            <p>
              Information you send through the contact form should be accurate
              and yours to share. [Add your terms around candidate resumes and
              client engagements here.]
            </p>

            <h2>Staffing services</h2>
            <p>
              [Describe how placements, fees, guarantee periods, and
              cancellations work. These are usually set out in a separate signed
              client agreement.]
            </p>

            <h2>Liability</h2>
            <p>
              [Add your limitation-of-liability and governing-law clauses,
              drafted for the jurisdictions you operate in.]
            </p>

            <h2>Contact</h2>
            <p>Questions about these terms? Email {contactDetails.email}.</p>
          </LegalBody>
        </Container>
      </section>
    </>
  );
}
