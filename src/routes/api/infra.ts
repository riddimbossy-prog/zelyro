import { createFileRoute } from "@tanstack/react-router";
import { getInfraStatus } from "@/lib/infra/status";

export const Route = createFileRoute("/api/infra")({
  server: {
    handlers: {
      GET: async () => {
        const status = await getInfraStatus();
        return Response.json(status);
      },
    },
  },
});
