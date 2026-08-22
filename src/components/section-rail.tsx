import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function SectionRail({
  title,
  to,
  children,
}: {
  title: string;
  to?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {to && (
          <Link to={to} className="text-sm font-medium text-primary hover:text-foreground">
            See all
          </Link>
        )}
      </div>
      <div className="media-rail">{children}</div>
    </section>
  );
}
