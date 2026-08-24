import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/verzzify/copy";

const LOGO = "/logo.png?v=5";
const MARK = "/icon-256.png?v=5";

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
        src={compact ? MARK : LOGO}
        alt={copy.app}
        className={cn(
          "w-auto bg-transparent object-contain object-left",
          compact ? "h-8 w-8 rounded-lg" : "h-8 md:h-10",
        )}
      />
    </Link>
  );
}
