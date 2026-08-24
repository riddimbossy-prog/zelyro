import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { copy } from "@/lib/verzzify/copy";

export function SectionRail({
  title,
  kicker = copy.kicker,
  to,
  children,
}: {
  title: string;
  kicker?: string;
  to?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          {kicker ? <p className="kicker">{kicker}</p> : null}
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
        </div>
        {to && (
          <Link to={to} className="text-sm font-semibold text-primary hover:text-foreground">
            Open all
          </Link>
        )}
      </div>
      <div className="media-rail">{children}</div>
    </section>
  );
}
