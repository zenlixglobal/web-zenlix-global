/**
 * Every piece of editable copy on the marketing site lives here.
 *
 * This replaces the `<!-- EDIT: ... -->` comments from the original static
 * HTML. Values still wrapped in [square brackets] are placeholders carried
 * over from that build — search this file for "[" to find everything that
 * still needs real content before launch.
 */

export type NavItem = { label: string; href: string };
/** Brand marks drawn in `src/components/site/social-icons.tsx`. */
export type SocialPlatform = "linkedin" | "x" | "instagram" | "facebook";
export type SocialLink = {
  platform: SocialPlatform;
  /** Accessible name for the icon link, e.g. "Zenlix Global on LinkedIn". */
  label: string;
  /** Full profile URL. Left empty, the icon is not rendered at all. */
  href: string;
};
export type Service = { num: string; title: string; description: string };
export type Stat = { value: string; label: string };
export type Testimonial = { quote: string; role: string; company: string };
export type Insight = {
  category: string;
  title: string;
  excerpt: string;
  /**
   * Omit until the article actually exists. The card then renders as a teaser
   * with no "Read Article" link, rather than shipping an href="#" that scrolls
   * to the top and reads as a broken link to crawlers.
   */
  href?: string;
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
  phone: "+1 (469) 692 3220",
  email: "info@zenlixglobal.com",
  addressLine1: "5900 Balcones Drive, STE 100",
  addressLine2: "Austin, TX 78731",
  /** Single-line form used in the footer. */
  addressShort: "5900 Balcones Drive, STE 100, Austin, TX 78731",
  /**
   * Where the address links to in the footer and on /contact.
   *
   * Google's documented Maps URL form rather than a share link or an embedded
   * place ID: it is stable, needs no API key, and resolves in whichever map
   * app the visitor has set as default on mobile.
   */
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=5900+Balcones+Drive+STE+100+Austin+TX+78731",
} as const;

/**
 * EDIT: the facts a US privacy policy has to state precisely.
 *
 * Kept out of the prose so the effective date and the retention periods can be
 * revised without re-reading the whole page. The retention windows are a
 * *promise*: nothing in the codebase deletes old rows yet, so whatever is set
 * here needs a matching purge before the policy is accurate.
 */
export const legalDetails = {
  /** The legal entity that controls the data — a policy has to name it. */
  entity: "Zenlix Global LLC",
  /** Rendered as "Last updated" on /privacy. */
  effectiveDate: "August 3, 2026",
  /**
   * Rendered as "Last updated" on /terms. Separate from the privacy date so
   * revising one page doesn't silently restate when the other last changed —
   * the date is what a dispute turns on when someone asks which version they
   * agreed to.
   */
  termsEffectiveDate: "August 3, 2026",
  /** Rights requests go here; can be the same inbox as contactDetails.email. */
  privacyEmail: "info@zenlixglobal.com",
  /** Toll-free line, or "" to drop the phone method from the rights section. */
  privacyPhone: "",
  /**
   * Governing law for /terms. Must be the state you actually operate from —
   * naming a state with no connection to the business is how a choice-of-law
   * clause gets struck out.
   */
  governingState: "Texas",
  /** Exclusive venue, phrased to drop straight into the sentence. */
  governingVenue:
    "the state and federal courts located in Collin County, Texas",
  /**
   * The vendor that routes our email, calls, and SMS on our behalf.
   *
   * Named in the terms and beside the contact form's submit button because
   * TCPA consent has to identify who the messages will come from — and carrier
   * A2P registration asks for the same disclosure. Replace with the partner's
   * full registered name.
   */
  messagingPartner: "Foxbridge Solutions Pvt Ltd",
  retention: {
    inquiries: "24 months",
    candidates: "36 months",
    analytics: "14 months",
  },
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

export const navCta: NavItem = { label: "Get in Touch", href: "/contact" };

/** EDIT: hero eyebrow label, headline, and subheading */
export const hero = {
  eyebrow: "Premier IT & Non-IT Staffing",
  headline: "We connect ambitious companies with",
  /** Rendered in italic gold as the second half of the headline. */
  headlineAccent: "talent that moves the needle.",
  lede: "Zenlix Global builds high-performance teams for organizations that refuse to settle for average. Direct hire, contract, and executive search, engineered around your growth, not our quota.",
  primaryCta: { label: "Get in Touch", href: "/contact" },
  // No secondary CTA: the hero asks for one thing. The services section is a
  // scroll away, so a button to it only competed with "Get in Touch".
  /** EDIT: replace with your real numbers, or delete any stat you lack data for. */
  stats: [
    { value: "92%", label: "Retention Rate" },
    { value: "550+", label: "Enterprise Clients" },
    { value: "10 Days", label: "Avg. Time-to-Fill" },
  ] satisfies Stat[],
  /** EDIT: hero side panel image + caption. */
  panel: {
    caption: "Client Spotlight",
    body: "From a single embedded recruiter to a fully outsourced hiring team, we scale with you as your headcount plans change quarter to quarter.",
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
        "Flexible, project-based talent that ramps up or down with your roadmap, with no long-term overhead.",
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
      title: "Healthcare Staffing",
      description:
        "Healthcare staffing: Specialized clinical and administrative staffing with a focus on compliance and quality care.",
    },
    {
      num: "08",
      title: "BPS & BPO Solutions",
      description:
        "Business process outsourcing and shared services solutions, optimizing operational efficiency and cost-effectiveness.",
    },
    // {
    //   num: "07",
    //   title: "Payroll & Compliance",
    //   description:
    //     "Employer-of-record and payrolling services so you can engage talent quickly without the administrative lift.",
    // },
    // {
    //   num: "08",
    //   title: "Workforce Consulting",
    //   description:
    //     "Headcount planning, market compensation data, and hiring-pipeline strategy for fast-scaling teams.",
    // },
  ] satisfies Service[],
} as const;

/** EDIT: the "why us" block — teaser on the home page, full version on /about. */
export const advantage = {
  eyebrow: "The Zenlix Advantage",
  heading: "We recruit the people who aren't applying anywhere.",
  body: "Job boards surface who's looking. Our network reaches the top performers who are quietly open to the right move: the candidates your competitors never see.",
  image: {
    src: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800",
    alt: "Recruiter reviewing candidate profiles",
  },
  /** Shown on /about only. */
  points: [
    "Passive-candidate sourcing beyond job boards and applicant pools",
    "Technical vetting by recruiters who understand the role, not just the title",
    "Dedicated account team from intake to offer.",
  ],
} as const;

/** EDIT: mid-page call-to-action strip. */
export const ctaStrip = {
  heading: "Ready to build a team that outperforms?",
  cta: { label: "Break the Ice", href: "/contact" },
} as const;

/** EDIT: social proof + insights. */
export const insightsSection = {
  eyebrow: "Social Proof & Insights",
  heading: "What our clients say, and what we're watching in the market.",
  /**
   * !! SAMPLE COPY — INVENTED, NOT REAL CLIENTS. REPLACE BEFORE LAUNCH. !!
   *
   * These exist so the section can be designed and reviewed with realistic
   * text in place. The companies are fictional and the quotes were written
   * here, not said by anyone.
   *
   * Publishing invented testimonials as if they were real is banned outright
   * by the Digital Markets, Competition and Consumers Act 2024 (fake consumer
   * reviews), and the ASA treats it as misleading advertising. Swap in real,
   * attributable quotes you have written permission to publish, or delete the
   * testimonials array and the section renders without it.
   */
  testimonials: [
    {
      quote:
        "We had two staff engineer roles open for five months. Zenlix filled both inside six weeks, and a year on, both hires are still with us.",
      role: "VP of Engineering",
      company: "Northwind Logistics",
    },
    {
      quote:
        "We needed a compliance lead who had actually run an FCA audit, not someone who had read about one. Zenlix sent three CVs and we hired from that first shortlist.",
      role: "Chief Operating Officer",
      company: "Calderwood Financial",
    },
  ] satisfies Testimonial[],
  /**
   * Add `href` to a card once the article is published and the "Read Article"
   * link appears on it automatically. Until then these are teasers, which is
   * why none of them link anywhere.
   */
  articles: [
    {
      category: "Hiring Trends",
      title: "Why senior engineering roles sit open for five months",
      excerpt:
        "It is almost never candidate supply. It is a job spec written for someone who does not exist, a five-stage interview loop, and two weeks of silence before the offer.",
      image: {
        src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600",
        alt: "Two engineers reviewing code together at a desk",
      },
    },
    {
      category: "Salary Guide",
      title: "What contract IT talent really costs in 2026",
      excerpt:
        "Bill rates are the number everyone negotiates. Conversion fees, ramp time, and the cost of a seat left empty for a quarter are the ones that decide the budget.",
      image: {
        src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=600",
        alt: "Financial paperwork and a calculator on a desk",
      },
    },
    {
      category: "Executive Search",
      title: "Replacing a leader without telling the market you are",
      excerpt:
        "Confidential search protects three parties at once: the incumbent still in the seat, the team who should not hear it as a rumour, and the candidate risking their current role to talk to you.",
      image: {
        src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=600",
        alt: "Two colleagues celebrating across a desk in an office",
      },
    },
  ] as Insight[],
} as const;

/**
 * EDIT: /about page copy.
 *
 * Deliberately undated: no founding year, no timeline, no founder byline. Every
 * claim here is about how the firm works rather than when it started, so the
 * page does not go stale and nothing unverifiable ships with it.
 */
export const aboutPage = {
  eyebrow: "Our Firm",
  heading: "A staffing partner that works like part of your team.",
  intro:
    "Zenlix Global places vetted IT and non-IT talent through direct hire, contract, executive search, and RPO. One recruiter stays on your search from the first conversation to the start date, and you only ever see candidates who have already been screened against your brief.",

  /**
   * The "who we are" narrative. `paragraphs` is an array so the prose can be
   * re-cut without touching the component.
   */
  story: {
    eyebrow: "Who We Are",
    heading: "A hiring partner you never have to chase.",
    lede: "You should know where your search stands without having to ask anyone for an update.",
    paragraphs: [
      "Zenlix Global is a staffing and executive search firm covering technology, business, healthcare, and leadership hiring across the United States, on direct hire, contract, executive search, and embedded engagements.",
      "Every search has one recruiter attached to it from the first call to the start date. They take the brief, do the screening, and present the shortlist, so you are never handed to a delivery team that was not in the room, and you never explain the role twice.",
      "You only ever see candidates who have already been screened against that brief and have agreed to the responsibilities and the work location. Nothing moves forward until you say it should. We schedule the interviews on your approval and keep both sides briefed, and the offer itself is yours to make.",
      "One senior hire, a contract team that scales with your roadmap, or a recruitment function running under your own brand: the shape of the engagement changes, the way it is run does not.",
    ],
    pullQuote:
      "Every resume we send comes with the reason it is on the list.",
    image: {
      src: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800",
      alt: "Two colleagues talking across a table in a bright meeting room",
    },
    /** The checkable facts, kept out of the prose so they are easy to correct. */
    facts: [
      { label: "Practices", value: "Staffing, Search, RPO" },
      { label: "Sectors", value: "IT, Non-IT, Healthcare" },
      { label: "Engagements", value: "Direct, Contract, Embedded" },
      { label: "Coverage", value: "Nationwide, US" },
    ],
  },

  /**
   * EDIT: the engagement, stage by stage. Add or drop steps freely — the rail
   * redraws itself around whatever is in this array.
   */
  process: {
    eyebrow: "How It Works",
    heading: "From the first conversation to a hire that stays.",
    intro:
      "The same five stages on every engagement, and you approve each one before it moves. No black box between the brief and the shortlist.",
    items: [
      {
        step: "01",
        title: "First contact",
        body: "It starts with an email: a short note from us, and a reply telling us what you are hiring for, the seniority and salary band you have in mind, and when you need somebody in the seat.",
      },
      {
        step: "02",
        title: "Resumes for review",
        body: "We work our own candidate pool against the brief and screen every candidate ourselves, taking them through the job responsibilities and the work location before anyone is put forward. What reaches you is a shortlist of resumes rather than a stack to sort through, and everyone on it has already been made aware of the role and the location.",
      },
      {
        step: "03",
        title: "Your approval",
        body: "You tell us who to take forward. Nobody is contacted about scheduling, and no candidate is told they are in process, until you have said yes to them.",
      },
      {
        step: "04",
        title: "Interviews",
        body: "We coordinate the calendars, brief the candidate on the format and who they are meeting, and carry the back-and-forth between both sides so your team only has to turn up and assess.",
      },
      {
        step: "05",
        title: "The hire",
        body: "You make the offer and agree the start date with your new hire.",
      },
    ],
  },
} as const;

/** EDIT: /contact page copy. */
export const contactPage = {
  eyebrow: "Get in Touch",
  heading: "Let's talk about your next hire.",
  intro:
    "Whether you're building a team or looking for your next role, tell us a bit about what you need and we'll follow up shortly.",
  formEyebrow: "Connect With Our Team",
  formHeading: "Start the conversation.",
  formIntro:
    "Discreet, professional, and entirely focused on your outcome, whether you're hiring or looking to make your next move.",
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
    "Elevating businesses through strategic talent acquisition and executive search across the globe.",
  columns: [
    {
      heading: "Company",
      links: [
        { label: "Our Firm", href: "/about" },
        { label: "Practice Areas", href: "/#services" },
        { label: "Client Success", href: "/#insights" },
        { label: "Get in Touch", href: "/contact" },
      ] satisfies NavItem[],
    },
  ],
  /**
   * Rendered as the footer's "Legal" column, not as fine print under the
   * copyright line: consent and data-handling terms people are told they agree
   * to at the contact form need to be findable without hunting.
   */
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ] satisfies NavItem[],
  /**
   * EDIT: paste the profile URLs. An entry with an empty `href` renders
   * nothing — a social icon that links to a page the firm does not run reads
   * worse than no icon at all — and the whole row disappears when none are set.
   *
   * These also feed `sameAs` in the Organization JSON-LD, which is how search
   * engines tie the profiles back to the site, so they belong in one list.
   */
  social: [
    {
      platform: "linkedin",
      label: "Zenlix Global on LinkedIn",
      href: "https://www.linkedin.com/company/zenlix-global/",
    },
    {
      platform: "facebook",
      label: "Zenlix Global on Facebook",
      href: "https://www.facebook.com/share/19Hsv4xZv5/",
    },
    { platform: "x", label: "Zenlix Global on X", href: "" },
    { platform: "instagram", label: "Zenlix Global on Instagram", href: "" },
  ] satisfies SocialLink[],
} as const;

/** The social profiles that actually have a URL set. */
export const activeSocialLinks = footer.social.filter((link) => link.href);
