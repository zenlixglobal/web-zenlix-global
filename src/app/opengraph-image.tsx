import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { site } from "@/content/site";

export const alt = `${site.name} | ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share card. Kept to system fonts and flat colour so it renders
 * without fetching a font binary at build time.
 */
export default async function OpenGraphImage() {
  // Satori can't resolve a runtime URL, so inline the mark as a data URI.
  const mark = await readFile(join(process.cwd(), "public", "zenlix-mark-og.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(ellipse at 75% 20%, #1b3a63 0%, #0a1b33 55%, #071527 100%)",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={markSrc} width={56} height={56} alt="" />
          <span style={{ color: "#ffffff", fontSize: 34, fontWeight: 600 }}>
            {site.name}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              color: "#c9a227",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {site.tagline}
          </span>
          <span
            style={{
              color: "#ffffff",
              fontSize: 62,
              lineHeight: 1.1,
              marginTop: 20,
              maxWidth: 900,
            }}
          >
            Talent that moves the needle.
          </span>
        </div>
      </div>
    ),
    size,
  );
}
