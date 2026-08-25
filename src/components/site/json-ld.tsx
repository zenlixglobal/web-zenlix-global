import { activeSocialLinks, contactDetails, site } from "@/content/site";

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
    /* "Zenlix" alone is the form Google currently autocorrects to "Zenox".
       Declaring it as an alternate name is one of the signals that ties the
       bare word to this organisation rather than a similarly spelled one. */
    alternateName: "Zenlix",
    url: site.url,
    description: site.description,
    logo: `${site.url}/zenlix-mark.png`,
    /* Omitted entirely while no profile URL is set: an empty sameAs array is a
       claim of "no profiles anywhere", not an absence of one. */
    ...(activeSocialLinks.length > 0
      ? { sameAs: activeSocialLinks.map((link) => link.href) }
      : {}),
    address: {
      "@type": "PostalAddress",
      ...contactDetails.postalAddress,
    },
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
