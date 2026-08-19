import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center text-foreground">
      <div>
        <span className="mx-auto grid size-12 place-items-center text-primary">
          <TriangleAlert className="size-8" />
        </span>
        <h1 className="mt-4 font-display text-2xl">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Try reloading the page."}
        </p>
      </div>
    </main>
  );
}
