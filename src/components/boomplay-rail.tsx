import { useQuery } from "@tanstack/react-query";
import { CoverCard } from "@/components/cover-card";
import { SectionRail } from "@/components/section-rail";
import { getBoomplayHome } from "@/lib/verzzify/boomplay";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { copy } from "@/lib/verzzify/copy";

export function BoomplayRail() {
  const q = useQuery({
    queryKey: ["boomplay-home"],
    queryFn: async () => {
      const geo = await getViewerGeo();
      const tracks = await getBoomplayHome({ data: geo.region });
      return { region: geo.regionName || geo.region, tracks };
    },
  });
  const tracks = q.data?.tracks ?? [];
  if (!tracks.length) return null;
  return (
    <SectionRail title={copy.houseCuts} kicker={q.data?.region ?? "Africa"}>
      {tracks.map((t) => (
        <CoverCard key={t.id} track={t} queue={tracks} subtitle={t.artistName} />
      ))}
    </SectionRail>
  );
}
