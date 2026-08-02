/** Shared typography for the legal pages, which are plain prose. */
export function LegalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-180 [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:text-xl [&_p]:mb-4 [&_p]:text-[15px] [&_p]:text-slate-muted sm:[&_h2]:text-2xl">
      {children}
    </div>
  );
}
