import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { LegalBody } from "@/components/site/legal-body";
import { PageBanner } from "@/components/site/page-banner";
import { contactDetails, legalDetails, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of the Zenlix Global website, your submissions through our contact form, and the communications you consent to receive from us.",
  alternates: { canonical: "/terms" },
};

/**
 * The published terms of service.
 *
 * Written against what the site actually does, in the same way `/privacy` is:
 * the only data path from a visitor to us is the contact form in
 * `src/components/contact/contact-form.tsx`, so the consent, conduct, and
 * submission clauses describe that form and nothing else.
 *
 * The communications section is the load-bearing one: it is the written
 * consent a TCPA claim turns on. It only holds because the same disclosure is
 * shown beside the submit button before anyone sends us a phone number. If
 * that disclosure is removed from the form, this clause stops being true.
 *
 * Deliberately absent: an arbitration and class-action-waiver clause. Whether
 * to bind candidates to arbitration is a business and legal decision, not a
 * default. Add it only on counsel's advice.
 */
export default function TermsPage() {
  const {
    entity,
    termsEffectiveDate,
    governingState,
    governingVenue,
    messagingPartner,
  } = legalDetails;
  const domain = site.url.replace(/^https?:\/\//, "");

  return (
    <>
      <PageBanner
        eyebrow="Legal"
        heading="Terms of Service"
        intro="The agreement between you and Zenlix Global when you use this website or send us your information."
      />
      <section className="py-14 sm:py-20">
        <Container>
          <LegalBody>
            <p>
              <strong>Last updated: {termsEffectiveDate}</strong>
            </p>

            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of{" "}
              {domain} and the information you submit to us through it. The
              website is operated by {entity} (&ldquo;{site.name}&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo;). By using this website or
              submitting your information to us,{" "}
              <strong>you agree to these Terms</strong>. If you do not agree,
              please do not use the site.
            </p>
            <p>
              How we handle the personal information you send us is set out
              separately in our <Link href="/privacy">Privacy Policy</Link>,
              which forms part of these Terms.
            </p>

            <h2>Who may use this site</h2>
            <p>
              This website is intended for a professional audience. You must be
              at least 18 years old and able to enter into a binding agreement
              to submit information to us. Do not use this site if you are
              barred from doing so under applicable law.
            </p>

            <h2>Our services</h2>
            <p>
              {site.name} provides staffing and talent acquisition services,
              including direct hire, contract staffing, IT and Non-IT staffing,
              executive search, recruitment process outsourcing (RPO),
              healthcare staffing, and business process solutions.
            </p>
            <p>
              The content on this website is general information about those
              services. It is <strong>not an offer of employment</strong>, not a
              binding employment contract, and not a guarantee of placement,
              interview, hire, or any particular outcome. Role descriptions and
              client requirements change, and roles may be filled or withdrawn
              without notice.
            </p>
            <p>
              Client engagements, including scope, fees, guarantee periods,
              replacement terms, invoicing, and termination, are governed by a
              separate written agreement signed by both parties.{" "}
              <strong>
                Where that agreement conflicts with these Terms, the signed
                agreement controls
              </strong>{" "}
              for that engagement. Nothing on this website varies a signed
              agreement or creates one.
            </p>

            <h2>No fees to candidates</h2>
            <p>
              We never charge candidates a fee to be represented, considered,
              placed, or kept in our talent network. If anyone claiming to
              represent {site.name} asks you for payment, a deposit, equipment
              costs, or your banking or government identification details in
              order to secure a role,{" "}
              <strong>it is not us. Do not pay, and tell us</strong> at{" "}
              {contactDetails.email}. We also do not conduct interviews or
              extend offers solely through messaging apps.
            </p>

            <h2>Equal opportunity</h2>
            <p>
              {site.name} is an equal opportunity employer and staffing partner.
              We recruit, present, and place candidates without regard to race,
              color, religion, sex, sexual orientation, gender identity,
              national origin, age, disability, veteran status, genetic
              information, or any other characteristic protected by federal,
              state, or local law, and we do not accept client instructions
              asking us to do otherwise.
            </p>

            <h2>Your submissions</h2>
            <p>
              When you use our contact form or otherwise send us information,
              you agree that the information you provide is accurate, current,
              and complete, and that it is yours to share. If you send us
              information about someone else, such as a reference, a colleague,
              or a team member, you confirm you are permitted to share it.
            </p>
            <p>
              Please do not send us, through this website, government
              identification numbers, financial account details, health
              information, immigration documents, or other sensitive
              information. Where an engagement genuinely requires that
              information, we will request it separately through a secure
              channel with its own notice.
            </p>
            <p>
              You keep ownership of everything you send us. You grant us a
              non-exclusive, worldwide, royalty-free permission to use, store,
              and reproduce your submission for the purpose of responding to
              your inquiry and providing our services. For candidates, that
              includes presenting your details to a prospective employer with
              your knowledge, as described in our{" "}
              <Link href="/privacy">Privacy Policy</Link>. We do not use your
              submission to train machine-learning models.
            </p>

            <h2>Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>
                submit false, misleading, or fraudulent information, or
                impersonate any person, employer, or entity;
              </li>
              <li>
                upload or transmit malicious code, or use the site to send spam
                or unsolicited commercial messages;
              </li>
              <li>
                scrape, crawl, harvest, or bulk-collect content, contact
                details, or candidate information from the site, or use it to
                build or train a dataset or model;
              </li>
              <li>
                attempt to access any account, administrative area, database, or
                system you are not authorized to reach, or probe, scan, or test
                the site&rsquo;s security;
              </li>
              <li>
                interfere with the operation or availability of the site,
                including through automated request volume, or circumvent any
                rate limit, filter, or other protective measure;
              </li>
              <li>
                use the site or our services for any unlawful, discriminatory,
                or infringing purpose.
              </li>
            </ul>
            <p>
              We may suspend or refuse access, remove submissions, and take any
              other step available to us where we reasonably believe this
              section has been breached.
            </p>

            <h2>Communications authorization</h2>
            <p>
              By providing your contact information, you expressly authorize{" "}
              {entity}, its employees, contractors, authorized representatives,
              and service providers to contact you by email, telephone, and
              SMS/text message regarding employment opportunities, recruiting,
              staffing services, updates on your inquiry or engagement, and
              other business-related communications.
            </p>

            <h3>Authorized personnel</h3>
            <p>
              Communications may be initiated or managed by authorized personnel
              located in the <strong>United States, India, or other countries</strong>,
              acting solely on behalf of {entity}. These individuals are bound by{" "}
              {site.name}&rsquo;s confidentiality, security, and privacy
              requirements, and may only use your information for the purposes
              described in these Terms and our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <h3>Third-party service providers</h3>
            <p>
              {entity} may use trusted third-party service providers, including
              communications platforms such as{" "}
              <strong>{messagingPartner}</strong>, to facilitate the delivery of
              emails, phone calls, and SMS/text messages on its behalf. These
              providers process your information under contract, solely to
              deliver those communications, and are{" "}
              <strong>
                not authorized to use your information for their own marketing
              </strong>
              . We do not sell or rent your contact details to anyone.
            </p>

            <h3>Consent</h3>
            <p>
              By submitting your information, you provide your{" "}
              <strong>express written consent</strong> to receive communications
              from {site.name}, including by automated telephone dialing
              system, prerecorded or artificial voice message, and SMS, at the
              email address and phone number you provide, in accordance with the{" "}
              <strong>Telephone Consumer Protection Act (TCPA)</strong> and other
              applicable federal, state, and local laws. The same disclosure is
              shown beside the submit button before you send us anything.
            </p>
            <p>
              <strong>
                Consent is not a condition of employment, of being considered for
                any role, or of receiving any service from us
              </strong>
              . You can ask us to reach you by email only, and we will.
            </p>

            <h3>Opt-out</h3>
            <p>
              You may withdraw your consent at any time. To stop SMS/text
              messages, reply <strong>STOP</strong> to any message; reply{" "}
              <strong>HELP</strong> for assistance. To opt out of marketing
              email, use the unsubscribe instructions in any message. You may
              also contact us directly at {contactDetails.email} or{" "}
              {contactDetails.phone}. We may still send you messages about an
              active inquiry, application, or placement.
            </p>

            <h3>Message and data rates</h3>
            <p>
              Standard message and data rates may apply based on your mobile
              carrier and service plan. Message frequency varies with your
              inquiry and any active search; we do not use SMS for bulk
              marketing campaigns. Delivery depends on your device, plan, and
              network, and carriers are not liable for delayed or undelivered
              messages.
            </p>

            <h2>Intellectual property</h2>
            <p>
              The content on this website, including text, graphics, logos,
              branding, layout, articles, and our methodologies, belongs to{" "}
              {entity} or
              its licensors and is protected by copyright, trademark, and other
              laws. We grant you a limited, revocable, non-transferable
              permission to view and use the site for your own professional or
              personal use.
            </p>
            <p>
              You may not copy, reproduce, republish, distribute, sell, or
              create derivative works from our content without our prior written
              permission. You may share a link to any page, and you may quote a
              short extract from an article with attribution and a link back to
              the source.
            </p>

            <h2>Third-party websites</h2>
            <p>
              Our site and our articles link to websites we do not operate. We
              provide those links for convenience, we do not control or endorse
              what is on them, and we are not responsible for their content or
              practices. Read their own terms and privacy notices before sharing
              information with them.
            </p>

            <h2>Availability of the site</h2>
            <p>
              We aim to keep the site available, but we may change, suspend, or
              discontinue any part of it, including any feature or content, at
              any time and without notice, and we may limit access for
              maintenance, security, or capacity reasons.
            </p>

            <h2>Disclaimer of warranties</h2>
            <p>
              The website and its content are provided{" "}
              <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>
              . To the fullest extent permitted by law, we disclaim all
              warranties, express or implied, including merchantability, fitness
              for a particular purpose, non-infringement, and any warranty as to
              uninterrupted or error-free operation.
            </p>
            <p>
              We do not warrant that role descriptions, salary ranges, timelines,
              or other information on the site are complete or current, that a
              submission will result in an interview, offer, hire, or placement,
              or that any hire will succeed. Nothing on this site is legal, tax,
              immigration, or employment advice.
            </p>
            <p>
              Some jurisdictions do not allow the exclusion of certain
              warranties, so parts of this section may not apply to you.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, {entity}, its directors,
              officers, employees, and partners (including {messagingPartner})
              will not be liable for any indirect, incidental, special,
              consequential, punitive, or exemplary damages, or for lost profits,
              lost revenue, lost opportunities, lost data, or reputational harm,
              arising out of or relating to your use of this website or your
              engagement with our recruitment process, even if we have been
              advised such damages are possible.
            </p>
            <p>
              Our total liability for any claim relating to this website or
              these Terms is limited to the greater of the amount you paid us in
              the six months before the claim, or US$100. Where you have a
              signed engagement agreement with us, that agreement&rsquo;s
              liability terms govern that engagement instead. Nothing here
              limits liability that cannot be limited by law, including for
              fraud, and some jurisdictions do not allow certain limitations, so
              parts of this section may not apply to you.
            </p>

            <h2>Indemnity</h2>
            <p>
              You agree to indemnify and hold {entity} harmless from any claim,
              loss, or expense (including reasonable legal fees) arising from
              your breach of these Terms, your misuse of the site, or
              information you submitted that you had no right to share.
            </p>

            <h2>Resolving a dispute</h2>
            <p>
              If something goes wrong, please contact us first at{" "}
              {contactDetails.email}. Most issues are resolved that way. If a
              dispute cannot be resolved informally within 30 days of written
              notice, either party may pursue it in court.
            </p>

            <h2>Governing law</h2>
            <p>
              These Terms are governed by the laws of the State of{" "}
              {governingState}, without regard to its conflict-of-law rules. Any
              action arising out of or relating to these Terms or your use of
              this website will be brought exclusively in {governingVenue}, and
              you consent to the personal jurisdiction of those courts. This
              does not deprive you of the protection of any mandatory consumer
              law of the state where you live.
            </p>

            <h2>General</h2>
            <ul>
              <li>
                <strong>Severability.</strong> If any provision is held
                unenforceable, the rest stays in force and the provision is
                limited to the minimum extent necessary.
              </li>
              <li>
                <strong>No waiver.</strong> Our not enforcing a provision is not
                a waiver of it.
              </li>
              <li>
                <strong>Assignment.</strong> You may not assign these Terms. We
                may assign them to a successor in connection with a merger,
                acquisition, or sale of assets.
              </li>
              <li>
                <strong>Entire agreement.</strong> These Terms and the{" "}
                <Link href="/privacy">Privacy Policy</Link> are the whole
                agreement between us about this website, and replace any earlier
                understanding about it. Signed engagement agreements are
                unaffected.
              </li>
              <li>
                <strong>Survival.</strong> The submissions, intellectual
                property, disclaimer, liability, indemnity, and governing-law
                sections survive any end to your use of the site.
              </li>
            </ul>

            <h2>Changes to these Terms</h2>
            <p>
              We may update these Terms as our services or the law change. The
              &ldquo;last updated&rdquo; date at the top shows when they last
              changed, and we will give prominent notice on the site before a
              material change takes effect. Continuing to use the site after a
              change means you accept the updated Terms.
            </p>

            <h2>Contact us</h2>
            <p>
              Questions about these Terms? Email {contactDetails.email}, call{" "}
              {contactDetails.phone}, or write to {entity},{" "}
              {contactDetails.addressLine1}, {contactDetails.addressLine2}.
            </p>
          </LegalBody>
        </Container>
      </section>
    </>
  );
}
