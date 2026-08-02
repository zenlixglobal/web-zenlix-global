import { cn } from "@/lib/utils";

/** The old `.wrap` element: centred column, responsive gutters. */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("container-wrap", className)} {...props} />;
}
