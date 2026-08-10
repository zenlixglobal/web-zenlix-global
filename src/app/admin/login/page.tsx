import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LogoMark } from "@/components/site/logo";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy-900 px-5 py-12">
      <div className="w-full max-w-95">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 font-heading text-xl text-white"
        >
          <LogoMark size={32} className="size-8" />
          Zenlix Global
        </Link>

        <div className="border border-line bg-white p-6 sm:p-8">
          <h1 className="text-2xl">Admin sign in</h1>
          <p className="mt-2 mb-6 text-sm text-slate-muted">
            Enquiries submitted through the website are listed here.
          </p>

          {/* Signed in to Supabase, but not on the team — suspended, removed,
              or never added. Said plainly, because the alternative is a login
              form that accepts the right password and still goes nowhere. */}
          {denied ? (
            <div className="mb-6 border-l-2 border-gold-500 bg-cream px-4 py-3">
              <p className="text-sm text-navy-900">
                That account doesn&rsquo;t have admin access.
              </p>
              <p className="mt-1 text-sm text-slate-muted">
                If it should, ask an owner to add you in Settings → Users.
                Otherwise sign in below with an account that does.
              </p>
            </div>
          ) : null}

          {isSupabaseConfigured() ? (
            <Suspense fallback={<div className="h-64" />}>
              <LoginForm />
            </Suspense>
          ) : (
            <p className="border-l-2 border-gold-500 bg-cream px-4 py-3 text-sm text-slate-muted">
              Supabase isn&apos;t configured yet. Add{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              and{" "}
              <code className="font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              to <code className="font-mono text-xs">.env.local</code>, then
              restart the dev server.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
