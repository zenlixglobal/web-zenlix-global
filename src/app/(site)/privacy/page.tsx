import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { LegalBody } from "@/components/site/legal-body";
import { PageBanner } from "@/components/site/page-banner";
import { TrackingOptOut } from "@/components/site/tracking-opt-out";
import { contactDetails, legalDetails, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Zenlix Global collects, uses, and protects the personal information of website visitors, candidates, and clients, and the privacy rights available to US residents.",
  alternates: { canonical: "/privacy" },
};

/**
 * The published privacy notice.
 *
 * Written against what the code actually does — the contact action in
 * `src/app/actions/contact.ts` and the cookie-free analytics pipeline in
 * `src/lib/analytics/` — because a notice that overstates or understates
 * collection is the thing regulators act on. If either changes, this page
 * changes with it.
 */
export default function PrivacyPage() {
  const { entity, effectiveDate, privacyEmail, privacyPhone, retention } =
    legalDetails;
  const host = site.url.replace(/^https?:\/\//, "");

  return (
    <>
      <PageBanner
        eyebrow="Legal"
        heading="Privacy Policy"
        intro="What we collect, why we collect it, who we share it with, and the choices you have over it."
      />
      <section className="py-14 sm:py-20">
        <Container>
          <LegalBody>
            <p>
              <strong>Last updated: {effectiveDate}</strong>
            </p>

            <p>
              This Privacy Policy explains how {entity} (&ldquo;
              {site.name}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
              uses, discloses, and retains personal information through{" "}
              {host} and in the course of our staffing and executive search
              services. It applies to website visitors, candidates, client
              contacts, and anyone who inquires with us.
            </p>

            <h2>Summary</h2>
            <ul>
              <li>
                <strong>We do not sell your personal information</strong>, and
                we do not share it for cross-context behavioral advertising, as
                those terms are defined under California and other US state
                privacy laws.
              </li>
              <li>
                <strong>We do not use advertising or tracking cookies.</strong>{" "}
                Our website analytics are first-party, self-hosted, and cannot
                follow you to other websites.
              </li>
              <li>
                <strong>
                  We honor Global Privacy Control (GPC) and Do Not Track
                  signals
                </strong>{" "}
                automatically, and you can opt out of analytics directly on this
                page.
              </li>
              <li>
                We collect what you send us through the contact form, plus
                limited, aggregated information about how the site is used.
              </li>
            </ul>

            <h2>Personal information we collect</h2>

            <h3>Information you give us</h3>
            <p>
              When you submit the contact form, we collect your first and last
              name, email address, phone number, company, the inquiry type you
              select, and the message you write. If you apply for a role, send
              us a résumé, or engage us as a client, we also collect the
              information contained in what you send, which for candidates
              typically includes work history, education, skills,
              certifications, references, and the compensation and location
              preferences you choose to share.
            </p>

            <h3>Information collected automatically</h3>
            <p>
              Our analytics are first-party and cookie-free. For each visit we
              record the pages viewed and their titles, the time engaged on a
              page, the referring website, any campaign (UTM) tags in the link
              you arrived through, your approximate country, your device type,
              browser, operating system, and screen width, and whether the
              contact form was submitted.
            </p>
            <p>
              We do not store your IP address, and we do not set a tracking
              cookie or a persistent identifier. Instead, a visit is grouped
              under a one-way cryptographic hash of your IP address and browser
              that is salted and{" "}
              <strong>rotates every day, so it cannot follow you</strong> from
              one day to the next or to any other website. A session identifier
              is stored in your browser&rsquo;s local storage and expires after
              30 minutes of inactivity. Your IP address is used momentarily, in
              memory, to rate-limit abusive traffic and form submissions, and is
              not written to our records.
            </p>

            <h3>Categories under California law</h3>
            <p>
              Over the past 12 months we have collected the following categories
              of personal information as those categories are defined by the
              California Consumer Privacy Act (CCPA):
            </p>
            <ul>
              <li>
                <strong>Identifiers:</strong> name, email address, phone number,
                and a daily-rotating pseudonymous visitor hash.
              </li>
              <li>
                <strong>Customer records / commercial information:</strong>{" "}
                employer name, inquiry type, and the contents of your message or
                engagement.
              </li>
              <li>
                <strong>Internet or network activity:</strong> pages viewed,
                referring site, campaign tags, and device, browser, and
                operating-system type.
              </li>
              <li>
                <strong>Geolocation data:</strong> approximate country only,
                derived at our network edge. We do not collect precise
                geolocation.
              </li>
              <li>
                <strong>Professional or employment-related information:</strong>{" "}
                for candidates and client contacts, this covers job title, work
                history, education, skills, and role preferences.
              </li>
            </ul>
            <p>
              We do not collect biometric information, precise geolocation,
              government identifiers, financial account details, health
              information, or the contents of your private communications
              through this website. We do not knowingly collect{" "}
              <strong>sensitive personal information</strong> for the purpose of
              inferring characteristics about you. Where a staffing engagement
              requires additional information, such as work authorization status
              or voluntary equal-employment-opportunity data, it is requested
              separately, with its own notice, and never through this
              website.
            </p>

            <h2>How we use personal information</h2>
            <ul>
              <li>To respond to your inquiry and communicate with you about it.</li>
              <li>
                To provide staffing and executive search services: matching
                candidates to roles, presenting candidates to clients with their
                knowledge, and managing placements.
              </li>
              <li>
                To send you a confirmation that we received your submission, and
                service-related messages about an active inquiry or engagement.
              </li>
              <li>
                To understand which pages and campaigns bring people to the site,
                in aggregate, so we can improve it.
              </li>
              <li>
                To keep the site secure and available by detecting abuse,
                filtering automated traffic, and rate-limiting submissions.
              </li>
              <li>
                To comply with legal obligations and to establish, exercise, or
                defend legal claims.
              </li>
            </ul>
            <p>
              We do not use your personal information to train machine-learning
              models, and we do not make decisions producing legal or similarly
              significant effects about you through automated processing alone.
              Candidate decisions involve human review.
            </p>

            <h2>How we disclose personal information</h2>
            <p>
              We disclose personal information only for the business purposes
              described above, to the following categories of recipients:
            </p>
            <ul>
              <li>
                <strong>Clients and prospective employers</strong>, where you are
                a candidate and we are representing you for a role. We tell you
                before we present you.
              </li>
              <li>
                <strong>Service providers</strong> who process data on our behalf
                under contract and may not use it for their own purposes: our
                database and authentication provider (Supabase), our
                transactional email provider (Resend), our website hosting and
                content-delivery provider ([Vercel]), and{" "}
                {legalDetails.messagingPartner}, which handles calls and text
                messages on our behalf.
              </li>
              <li>
                <strong>Professional advisers</strong> such as lawyers,
                accountants, and auditors, where necessary.
              </li>
              <li>
                <strong>Authorities</strong>, where we are legally required to
                disclose, or to protect our rights, safety, or property.
              </li>
              <li>
                <strong>A successor entity</strong>, in connection with a merger,
                acquisition, or sale of assets, subject to this policy.
              </li>
            </ul>
            <p>
              <strong>
                We have not sold personal information, and we have not shared
                personal information for cross-context behavioral advertising,
                in the past 12 months,
              </strong>{" "}
              including the personal information of anyone we know to be under
              16. We do not offer financial incentives in exchange for personal
              information.
            </p>

            <h2>Your choices</h2>

            <h3>Website analytics</h3>
            <p>
              You can opt out of our analytics at any time. We also honor the
              Global Privacy Control (GPC) and Do Not Track signals
              automatically: if your browser or extension sends one, nothing is
              recorded, and no action is needed from you.
            </p>
            <TrackingOptOut />

            <h3>Email, calls, and texts</h3>
            <p>
              Marketing emails carry an unsubscribe link in every message, and we
              act on unsubscribes promptly. You may also ask us to stop by
              emailing {privacyEmail}. We may still send you service messages
              about an active inquiry, application, or placement. If you give us
              a phone number, you consent to being contacted about your inquiry
              at that number by call or text, by us and by{" "}
              {legalDetails.messagingPartner}, which routes those messages on our
              behalf. Message and data rates may apply, you can withdraw consent
              at any time by replying STOP or telling us, and consent to calls or
              texts is never a condition of being considered for any role or
              service.
            </p>

            <h2>Your privacy rights</h2>
            <p>
              Depending on where you live, US state privacy law gives you rights
              over your personal information. Rather than track which law covers
              you, <strong>we extend the following rights to every US resident</strong>:
            </p>
            <ul>
              <li>
                <strong>Know and access:</strong> what we have collected, the
                sources, why, and who we disclosed it to.
              </li>
              <li>
                <strong>Correct</strong> inaccurate personal information.
              </li>
              <li>
                <strong>Delete</strong> personal information we hold about you,
                subject to legal exceptions.
              </li>
              <li>
                <strong>Portability:</strong> receive a copy in a portable,
                readily usable format.
              </li>
              <li>
                <strong>Opt out</strong> of the sale or sharing of personal
                information, of targeted advertising, and of profiling with
                significant effects. We do none of these, so there is nothing to
                opt out of, but the right stands.
              </li>
              <li>
                <strong>Limit the use of sensitive personal information.</strong>{" "}
                We only use it for the purposes permitted without a limitation
                right.
              </li>
              <li>
                <strong>Non-discrimination:</strong> we will not deny you
                service, charge you a different price, or treat you differently
                for exercising any of these rights.
              </li>
            </ul>
            <p>
              California residents may also request the specific pieces of
              personal information we hold. If you are a California-based job
              applicant, contractor, or employee, these rights apply to your
              information in that capacity too.
            </p>

            <h3>How to make a request</h3>
            <p>
              Email {privacyEmail}
              {privacyPhone ? `, call ${privacyPhone},` : ""} or write to{" "}
              {contactDetails.addressShort}. Tell us which right you are
              exercising. We will acknowledge your request and respond within 45
              days, extendable once by a further 45 days where the request is
              complex. We will tell you if we need the extension.
            </p>
            <p>
              To protect your information, we verify requests before acting on
              them: we will ask you to confirm details that match what we already
              hold, such as the email address you used to contact us. We cannot
              fulfill a request we cannot verify. An{" "}
              <strong>authorized agent</strong> may make a request for you with
              written permission, which we may ask to confirm directly with you.
            </p>
            <p>
              <strong>Appeals.</strong> If we decline your request, our response
              will explain why. You may appeal by replying to that response or
              emailing {privacyEmail} with &ldquo;Privacy Appeal&rdquo; in the
              subject line. We will respond to the appeal within 45 days with a
              written explanation, and tell you how to contact your state
              attorney general if you disagree with the outcome.
            </p>

            <h2>How long we keep information</h2>
            <ul>
              <li>
                <strong>Inquiries</strong> submitted through the contact form:{" "}
                {retention.inquiries} from your last contact with us.
              </li>
              <li>
                <strong>Candidate and client records</strong>:{" "}
                {retention.candidates} from our last active engagement, so we can
                approach you about relevant roles. You can ask us to delete
                sooner at any time.
              </li>
              <li>
                <strong>Website analytics</strong>: {retention.analytics}. These
                records are pseudonymous and cannot be traced back to you.
              </li>
            </ul>
            <p>
              We keep information longer only where a law, a tax or employment
              record-keeping obligation, or an active legal claim requires it.
            </p>

            <h2>How we protect information</h2>
            <p>
              The site is served over HTTPS. Our database enforces row-level
              security, so inquiry and candidate records are readable only by
              authenticated members of our team. Administrative access requires
              individual accounts, and the form is protected against automated
              abuse. No system is perfectly secure, but we work to keep our
              safeguards proportionate to the sensitivity of what we hold.
            </p>

            <h2>Background and reference checks</h2>
            <p>
              Where a role requires a background check, employment verification,
              or reference check, it is carried out separately from this
              website. If a consumer reporting agency is involved, you will
              receive the disclosure and be asked for the written authorization
              required by the Fair Credit Reporting Act and any applicable state
              law before anything is requested, along with your rights if
              information in a report affects a decision about you.
            </p>

            <h2>Children</h2>
            <p>
              This website is intended for a professional audience and is not
              directed to children. We do not knowingly collect personal
              information from anyone under 16. If you believe a child has
              provided us information, email {privacyEmail} and we will delete
              it.
            </p>

            <h2>Where your information is processed</h2>
            <p>
              We are based in the United States, and the records we hold are
              stored in the United States. If you contact us from outside the
              US, you understand that your information will be transferred to
              and processed in the US, where data protection law differs from
              that of your own country.
            </p>
            <p>
              Our recruiters, contractors, and authorized representatives,
              including personnel located in{" "}
              <strong>India and other countries</strong>, may access your
              information to work on your inquiry, search, or placement. They
              act only on our instructions and are bound by our confidentiality,
              security, and privacy requirements by contract. Our{" "}
              <Link href="/terms">Terms of Service</Link> set out the same
              authorization for communications.
            </p>

            <h2>Third-party links</h2>
            <p>
              Our site and our articles link to websites we do not operate. This
              policy does not cover them, and we are not responsible for their
              privacy practices. Read their notices before sharing information
              with them.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy as our practices or the law change. The
              &ldquo;last updated&rdquo; date at the top shows when it last
              changed, and we will give prominent notice on the site of any
              material change before it takes effect.
            </p>

            <h2>Contact us</h2>
            <p>
              Questions, requests, or complaints about this policy or your
              personal information: email {privacyEmail}
              {privacyPhone ? `, call ${privacyPhone},` : ""} or write to{" "}
              {entity}, {contactDetails.addressLine1},{" "}
              {contactDetails.addressLine2}. If you need this policy in an
              alternative accessible format, contact us and we will provide one.
            </p>
          </LegalBody>
        </Container>
      </section>
    </>
  );
}
