import { createFileRoute } from "@tanstack/react-router";
import { loadHome } from "@/lib/verzzify/queries";

export const Route = createFileRoute("/api/v1/home")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(await loadHome(), {
          headers: { "access-control-allow-origin": "*" },
        }),
    },
  },
});
