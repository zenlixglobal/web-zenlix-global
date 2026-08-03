/**
 * Every piece of editable copy on the marketing site lives here.
 *
 * This replaces the `<!-- EDIT: ... -->` comments from the original static
 * HTML. Values still wrapped in [square brackets] are placeholders carried
 * over from that build — search this file for "[" to find everything that
 * still needs real content before launch.
 */

export type NavItem = { label: string; href: string };
export type Service = { num: string; title: string; description: string };
export type Stat = { value: string; label: string };
export type Testimonial = { quote: string; role: string; company: string };
export type Insight = {
  category: string;
  title: string;
  excerpt: string;
  href: string;
  image: { src: string; alt: string };
};

export const site = {
  name: "Zenlix Global",
  tagline: "IT & Non-IT Staffing, Executive Search",
  description:
    "Zenlix Global is a national staffing and executive search firm connecting companies with vetted IT and Non-IT talent, direct hire, contract, and RPO solutions.",
  /**
   * Used for canonical URLs, sitemap, robots and OG tags.
   * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://zenlixglobal.com).
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_US",
} as const;

/** EDIT: contact details — these also feed the footer and JSON-LD. */
export const contactDetails = {
  phone: "[+1 (000) 000-0000]",
  email: "[contact@zenlixglobal.com]",
  addressLine1: "[Your Street Address]",
  addressLine2: "[City, State ZIP]",
  /** Single-line form used in the footer. */
  addressShort: "[Your Street Address, City, ST]",
} as const;

/** EDIT: nav menu items / links */
export const mainNav: NavItem[] = [
  { label: "Expertise", href: "/#services" },
  { label: "Our Firm", href: "/about" },
  { label: "Insights", href: "/#insights" },
  // "Partner With Us" was removed from the header — the gold "Hire Talent"
  // button already sends people to /contact, and two links to the same page
  // split the click. It still appears in the footer's Company column.
];

export const navCta: NavItem = { label: "Hire Talent", href: "/contact" };

/** EDIT: hero eyebrow label, headline, and subheading */
export const hero = {
  eyebrow: "Premier IT & Non-IT Staffing",
  headline: "We connect ambitious companies with",
  /** Rendered in italic gold as the second half of the headline. */
  headlineAccent: "talent that moves the needle.",
  lede: "Zenlix Global builds high-performance teams for organizations that refuse to settle for average. Direct hire, contract, and executive search — engineered around your growth, not our quota.",
  primaryCta: { label: "Hire Talent", href: "/contact" },
  secondaryCta: { label: "Explore Expertise", href: "/#services" },
  /** EDIT: replace with your real numbers, or delete any stat you lack data for. */
  stats: [
    { value: "92%", label: "Retention Rate" },
    { value: "150+", label: "Enterprise Clients" },
    { value: "10 Days", label: "Avg. Time-to-Fill" },
  ] satisfies Stat[],
  /** EDIT: hero side panel image + caption. */
  panel: {
    caption: "Client Spotlight",
    body: "From a single embedded recruiter to a fully outsourced hiring team — we scale with you as your headcount plans change quarter to quarter.",
    image: {
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800",
      alt: "Team collaborating in a modern office",
    },
  },
} as const;

/** EDIT: services section heading + cards. Add/remove entries to change the grid. */
export const servicesSection = {
  eyebrow: "Our Expertise",
  heading: "End-to-end staffing solutions, built around how you actually hire.",
  intro:
    "From a single critical hire to a full recruitment function, our practice areas cover the full lifecycle of workforce planning.",
  services: [
    {
      num: "01",
      title: "Direct Hire",
      description:
        "Full-time, permanent placements matched to your team's technical bar and culture, not just the job description.",
    },
    {
      num: "02",
      title: "Contract Staffing",
      description:
        "Flexible, project-based talent that ramps up or down with your roadmap — no long-term overhead.",
    },
    {
      num: "03",
      title: "IT Staffing",
      description:
        "Engineers, architects, and data specialists vetted for real production experience, not keyword-matched resumes.",
    },
    {
      num: "04",
      title: "Non-IT Staffing",
      description:
        "Operations, finance, administrative, and business support talent for the functions that keep your company running.",
    },
    {
      num: "05",
      title: "Executive Search",
      description:
        "Confidential, retained search for leadership roles where the wrong hire costs far more than the search fee.",
    },
    {
      num: "06",
      title: "RPO Solutions",
      description:
        "An embedded recruitment team that runs inside your process, under your brand, at enterprise scale.",
    },
    {
      num: "07",
      title: "Payroll & Compliance",
      description:
        "Employer-of-record and payrolling services so you can engage talent quickly without the administrative lift.",
    },
    {
      num: "08",
      title: "Workforce Consulting",
      description:
        "Headcount planning, market compensation data, and hiring-pipeline strategy for fast-scaling teams.",
    },
  ] satisfies Service[],
} as const;

/** EDIT: the "why us" block — teaser on the home page, full version on /about. */
export const advantage = {
  eyebrow: "The Zenlix Advantage",
  heading: "We recruit the people who aren't applying anywhere.",
  body: "Job boards surface who's looking. Our network reaches the top performers who are quietly open to the right move — the candidates your competitors never see.",
  badge: { value: "[10+]", label: "Years in Talent" },
  image: {
    src: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800",
    alt: "Recruiter reviewing candidate profiles",
  },
  /** Shown on /about only. */
  points: [
    "Passive-candidate sourcing beyond job boards and applicant pools",
    "Technical vetting by recruiters who understand the role, not just the title",
    "Cultural and behavioral alignment checked before a resume ever reaches you",
    "Dedicated account team from intake through 90-day placement check-in",
  ],
} as const;

/** EDIT: mid-page call-to-action strip. */
export const ctaStrip = {
  heading: "Ready to build a team that outperforms?",
  cta: { label: "Start the Conversation", href: "/contact" },
} as const;

/** EDIT: social proof + insights. */
export const insightsSection = {
  eyebrow: "Social Proof & Insights",
  heading: "What our clients say — and what we're watching in the market.",
  /** EDIT: sample quotes, not real clients. Replace once you have permission to publish them. */
  testimonials: [
    {
      quote: "[Insert a real client testimonial quote here.]",
      role: "[Client Job Title]",
      company: "[Client Company or Industry]",
    },
    {
      quote: "[Insert a second client testimonial quote here.]",
      role: "[Client Job Title]",
      company: "[Client Company or Industry]",
    },
  ] satisfies Testimonial[],
  /** EDIT: replace `href` with the real article URL, or delete a card. */
  articles: [
    {
      category: "[Category]",
      title: "[Article headline goes here]",
      excerpt: "[One or two sentence summary of the article goes here.]",
      href: "#",
      image: {
        src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600",
        alt: "Engineers collaborating around a laptop",
      },
    },
    {
      category: "[Category]",
      title: "[Article headline goes here]",
      excerpt: "[One or two sentence summary of the article goes here.]",
      href: "#",
      image: {
        src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=600",
        alt: "Financial analyst reviewing charts",
      },
    },
    {
      category: "[Category]",
      title: "[Article headline goes here]",
      excerpt: "[One or two sentence summary of the article goes here.]",
      href: "#",
      image: {
        src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=600",
        alt: "Executive leadership meeting",
      },
    },
  ] satisfies Insight[],
} as const;

/** EDIT: /about page copy. */
export const aboutPage = {
  eyebrow: "Our Firm",
  heading: "Built by recruiters who wanted to do it differently.",
  intro:
    "Zenlix Global exists because too many staffing firms optimize for speed over fit. We optimize for fit first — and speed follows.",
  story: {
    eyebrow: "Our Story",
    heading: "[A short paragraph on how and why your firm was founded.]",
    body: "[Add a few more sentences here about your team's background, the industries you focus on, and what makes your approach different. This is a good place for a founder's note or a brief company timeline.]",
  },
} as const;

/** EDIT: /contact page copy. */
export const contactPage = {
  eyebrow: "Partner With Us",
  heading: "Let's talk about your next hire.",
  intro:
    "Whether you're building a team or looking for your next role, tell us a bit about what you need and we'll follow up shortly.",
  formEyebrow: "Connect With Our Team",
  formHeading: "Start the conversation.",
  formIntro:
    "Discreet, professional, and entirely focused on your outcome — whether you're hiring or looking to make your next move.",
  note: "Placeholder contact details — replace the bracketed text in src/content/site.ts with your real phone number, email, and office address before publishing.",
} as const;

/**
 * Inquiry types offered in the contact form.
 *
 * `value` is what gets stored in Supabase, so keep these stable — changing a
 * value orphans it from historical rows. The matching allow-list lives in
 * `src/lib/validation/contact.ts`.
 */
export const inquiryGroups = [
  {
    label: "For Companies (Clients)",
    options: [
      { value: "hire-talent", label: "Looking to Hire Talent" },
      { value: "it-staffing", label: "IT Staffing Solutions" },
      { value: "non-it-staffing", label: "Non-IT Staffing Solutions" },
      { value: "executive-search", label: "Executive Search" },
    ],
  },
  {
    label: "For Candidates",
    options: [
      { value: "candidate", label: "Looking for a Job / Submit Resume" },
    ],
  },
  {
    label: "Other",
    options: [{ value: "general", label: "General Inquiry" }],
  },
] as const;

export const inquiryValues = inquiryGroups.flatMap((group) =>
  group.options.map((option) => option.value),
) as [string, ...string[]];

/** Human-readable label for a stored inquiry value (used in the admin UI + emails). */
export function inquiryLabel(value: string): string {
  for (const group of inquiryGroups) {
    for (const option of group.options) {
      if (option.value === value) return option.label;
    }
  }
  return value;
}

/** EDIT: footer. */
export const footer = {
  tagline:
    "[Elevating businesses through strategic talent acquisition and executive search across North America.]",
  columns: [
    {
      heading: "Company",
      links: [
        { label: "Our Firm", href: "/about" },
        { label: "Practice Areas", href: "/#services" },
        { label: "Client Success", href: "/#insights" },
        { label: "Partner With Us", href: "/contact" },
      ] satisfies NavItem[],
    },
  ],
  newsletter: {
    heading: "Industry Insights",
    body: "Subscribe for hiring trends, salary guides, and top-talent alerts.",
    placeholder: "you@company.com",
    cta: "Join",
  },
  /** EDIT: replace with real pages once written. */
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ] satisfies NavItem[],
} as const;
