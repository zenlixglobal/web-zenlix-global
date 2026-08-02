import { contactDetails, site } from "@/content/site";

/**
 * Structured data for the firm. Rendered with `<script type="application/ld+json">`
 * per the Next.js JSON-LD guide — the payload is our own static content, not
 * user input, so there is nothing injectable here.
 */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    description: site.description,
    logo: `${site.url}/zenlix-mark.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: contactDetails.phone,
        email: contactDetails.email,
        availableLanguage: ["English"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
