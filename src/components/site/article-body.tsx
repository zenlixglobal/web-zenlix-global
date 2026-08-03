import Link from "next/link";

/**
 * Renders an article body written in a small Markdown subset.
 *
 * Deliberately hand-rolled and deliberately tiny. The alternative is to accept
 * HTML and pass it to `dangerouslySetInnerHTML`, which would turn the admin
 * editor into a stored-XSS vector the moment anyone with write access is
 * careless. Here the body is parsed into React elements, so nothing an author
 * types can become markup.
 *
 * Supported:
 *   ## Heading            (and ### for a sub-heading)
 *   - bullet              (consecutive lines form one list)
 *   1. numbered           (likewise)
 *   > pull quote
 *   blank line            paragraph break
 *   **bold**, *italic*, [text](https://…)
 */

type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  // Normalise CRLF so a body pasted from Word doesn't produce stray \r.
  const lines = body.replace(/\r\n?/g, "\n").split("\n");

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    blocks.push({ kind: "list", ...list });
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1]!.length === 2 ? 2 : 3,
        text: heading[2]!.trim(),
      });
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);

    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const text = (bullet ?? numbered)![1]!.trim();

      // A change of list type starts a new list rather than mixing markers.
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(text);
      continue;
    }

    flushList();

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      blocks.push({ kind: "quote", text: quote[1]!.trim() });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

/** Only http(s) links. Blocks `javascript:` and other active schemes. */
function safeHref(href: string): string | null {
  try {
    const url = new URL(href, "https://example.invalid");
    return url.protocol === "http:" || url.protocol === "https:" ? href : null;
  } catch {
    return null;
  }
}

/** Inline **bold**, *italic* and [text](url), as React nodes. */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const pattern =
    /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)\s]+\))/g;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)!;
      const href = safeHref(link[2]!);
      nodes.push(
        href ? (
          <Link
            key={key}
            href={href}
            className="text-navy-900 underline decoration-gold-500 underline-offset-4 hover:text-gold-500"
          >
            {link[1]}
          </Link>
        ) : (
          // Unsafe scheme: keep the words, drop the link.
          link[1]
        ),
      );
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));

  return nodes;
}

export function ArticleBody({ body }: { body: string }) {
  const blocks = parse(body);

  return (
    <div className="max-w-180">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        switch (block.kind) {
          case "heading":
            return block.level === 2 ? (
              <h2 key={key} className="mt-9 mb-3 text-xl sm:text-2xl">
                {inline(block.text, key)}
              </h2>
            ) : (
              <h3 key={key} className="mt-7 mb-2.5 text-lg">
                {inline(block.text, key)}
              </h3>
            );

          case "quote":
            return (
              <blockquote
                key={key}
                className="my-6 border-l-2 border-gold-500 pl-5 font-heading text-lg text-navy-900 italic"
              >
                {inline(block.text, key)}
              </blockquote>
            );

          case "list":
            return block.ordered ? (
              <ol
                key={key}
                className="mb-4 list-decimal space-y-1.5 pl-5 text-[15px] text-slate-muted"
              >
                {block.items.map((item, i) => (
                  <li key={i}>{inline(item, `${key}-${i}`)}</li>
                ))}
              </ol>
            ) : (
              <ul
                key={key}
                className="mb-4 list-disc space-y-1.5 pl-5 text-[15px] text-slate-muted"
              >
                {block.items.map((item, i) => (
                  <li key={i}>{inline(item, `${key}-${i}`)}</li>
                ))}
              </ul>
            );

          default:
            return (
              <p key={key} className="mb-4 text-[15px] text-slate-muted">
                {inline(block.text, key)}
              </p>
            );
        }
      })}
    </div>
  );
}
