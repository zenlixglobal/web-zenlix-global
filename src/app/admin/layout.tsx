import type { Metadata } from "next";

/** Admin pages are never indexed; see also the X-Robots-Tag in next.config.ts. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Zenlix Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-dvh flex-col bg-cream">{children}</div>;
}
