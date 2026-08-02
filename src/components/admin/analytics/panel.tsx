import { cn } from "@/lib/utils";

/**
 * The square-cornered white block every analytics section sits in — the same
 * `border-line` treatment the enquiries table already uses, so the two admin
 * pages read as one product.
 */
export function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("border border-line bg-white", className)}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-4 py-3">
        <div>
          <h2 className="font-heading text-sm font-semibold text-navy-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className={cn("px-4 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Shown in place of a chart or list when the range produced nothing. */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-slate-muted">{children}</p>
  );
}

/**
 * The WCAG-clean twin every chart ships with: collapsed by default, but the
 * exact numbers are always one click away and never gated behind a tooltip.
 */
export function TableView({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  if (rows.length === 0) return null;

  return (
    <details className="mt-4 border-t border-line pt-3 text-xs">
      <summary className="cursor-pointer text-slate-muted transition-colors hover:text-navy-900">
        Table view
      </summary>
      <div className="mt-3 max-h-72 overflow-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    "py-1.5 pr-3 font-medium text-slate-muted",
                    index > 0 && "text-right",
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-line/60 last:border-0">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "py-1.5 pr-3 text-ink",
                      cellIndex > 0 && "text-right tabular-nums",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
