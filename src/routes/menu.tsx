import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MenuItemCard } from "@/components/menu-item-card";
import { menuQuery } from "@/lib/menu.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu & Online Ordering — Miami Grill Lauderhill" },
      { name: "description", content: "Browse gyros, burgers, Philly cheesesteaks, wings, subs, smoothies and shakes. Order online for pickup." },
      { property: "og:title", content: "Menu — Miami Grill Lauderhill" },
      { property: "og:description", content: "Gyros, burgers, cheesesteaks, wings and more. Order online for pickup." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery),
  component: MenuPage,
});

function MenuPage() {
  const { data } = useSuspenseQuery(menuQuery);
  const groups = data.categories
    .map((c) => ({ ...c, items: data.items.filter((i) => i.category_id === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="eyebrow text-primary">Order for pickup</p>
      <h1 className="mt-2 font-display text-5xl font-black uppercase">Our Menu</h1>
      <nav className="sticky top-16 z-30 -mx-4 mt-8 flex gap-2 overflow-x-auto border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        {groups.map((g) => (
          <a key={g.id} href={`#cat-${g.id}`} className="shrink-0 rounded-full border border-border px-4 py-1.5 font-display text-xs font-bold uppercase hover:border-primary hover:text-primary">
            {g.name}
          </a>
        ))}
      </nav>
      {groups.map((g) => (
        <section key={g.id} id={`cat-${g.id}`} className="scroll-mt-32 pt-12">
          <h2 className="mb-6 font-display text-2xl font-black uppercase"><span className="text-primary">/</span> {g.name}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.items.map((i) => <MenuItemCard key={i.id} item={i} />)}
          </div>
        </section>
      ))}
      <p className="mt-12 text-sm text-muted-foreground">
        Allergies or dietary questions? See our <a className="text-primary underline" href={SITE.nutritionPdf} target="_blank" rel="noreferrer">nutrition info</a> or call {SITE.phone}.
      </p>
    </div>
  );
}
