import { createServerFn } from "@tanstack/react-start";

export type ViewerGeo = {
  region: string;
  regionName: string;
  city: string | null;
  source: "header" | "ip" | "language" | "default";
};

export const getViewerGeo = createServerFn({ method: "GET" }).handler(async () => {
  const { detectViewerGeo } = await import("./geo.server");
  return detectViewerGeo();
});
