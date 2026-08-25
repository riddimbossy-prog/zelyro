import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  collectRoutePathsFromTree,
  installPreviewHostBridge,
  resolveParentEmbedderOrigin,
} from "@/lib/preview-host-bridge";

export function PreviewHostBridge() {
  const router = useRouter();

  useEffect(() => {
    const ancestorOrigin =
      typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0
        ? location.ancestorOrigins[0]
        : null;
    const parentOrigin = resolveParentEmbedderOrigin(
      window.parent === window,
      document.referrer,
      ancestorOrigin,
      window.location.hostname,
    );
    // Only wipe service workers inside the Grok preview iframe.
    if (parentOrigin && typeof navigator !== "undefined" && navigator.serviceWorker) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) void r.unregister();
      });
    }
    return installPreviewHostBridge({
      navigate: (path) => {
        router.history.push(path);
      },
      getRoutePaths: () => collectRoutePathsFromTree(router.routeTree),
    });
  }, [router]);

  return null;
}
