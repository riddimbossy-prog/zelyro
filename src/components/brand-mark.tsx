import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/verzzify/copy";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link to="/" className={cn("flex min-w-0 items-center", className)} aria-label={copy.app}>
      <img
        src="/logo.png?v=3"
        alt={copy.app}
        className={cn(
          "w-auto bg-transparent object-contain object-left",
          compact ? "h-7" : "h-9 md:h-10",
        )}
      />
    </Link>
  );
}
