import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getNews } from "@/lib/zelyro/queries";

export const Route = createFileRoute("/_app/news")({ component: News });

function News() {
  const q = useQuery({ queryKey: ["news"], queryFn: () => getNews() });
  return (
    <div>
      <h1 className="font-display text-3xl">Zelyro Journal</h1>
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {(q.data ?? []).map((a) => (
          <li key={a.id} className="overflow-hidden rounded-3xl bg-card">
            {a.cover_url && <img src={a.cover_url} alt="" className="h-40 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs tracking-widest text-sand uppercase">{a.category}</p>
              <h2 className="mt-2 font-display text-xl">{a.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{a.excerpt}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
