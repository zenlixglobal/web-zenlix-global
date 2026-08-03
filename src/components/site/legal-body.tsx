/** Shared typography for the legal pages, which are plain prose. */
export function LegalBody({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        "max-w-180",
        "[&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:text-xl sm:[&_h2]:text-2xl",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink",
        "[&_p]:mb-4 [&_p]:text-[15px] [&_p]:text-slate-muted",
        // Lists carry most of a privacy policy: the categories collected, the
        // rights available, who data is shared with.
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:mb-2 [&_li]:text-[15px] [&_li]:text-slate-muted [&_li]:marker:text-gold-500",
        "[&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-gold-500",
        "[&_strong]:font-semibold [&_strong]:text-ink",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
