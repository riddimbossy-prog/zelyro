import { createServerFn } from "@tanstack/react-start";
import type { ViewerGeo } from "./types";

export type { ViewerGeo };

/** Client-safe RPC. Implementation lives in geo.server.ts (request headers / IP). */
export const getViewerGeo = createServerFn({ method: "GET" }).handler(async (): Promise<ViewerGeo> => {
  const { detectViewerGeo } = await import("./geo.server");
  return detectViewerGeo();
});
