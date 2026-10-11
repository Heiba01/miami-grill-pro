import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MenuItemCard } from "@/components/menu-item-card";
import { menuQuery } from "@/lib/menu.functions";
import { recommendDishes, type RecommendResult } from "@/lib/recommend.functions";

export const Route = createFileRoute("/recommend")({
  head: () => ({
    meta: [
      { title: "Find Your Dish — AI Food Guide | Miami Grill Lauderhill" },
      { name: "description", content: "Tell us your tastes or dietary needs and get personalized Miami Grill dish picks with reasons why." },
      { property: "og:title", content: "Find Your Dish at Miami Grill" },
      { property: "og:description", content: "Personalized dish recommendations based on your cravings and dietary needs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery),
  component: RecommendPage,
});

const examples = [
  "Something spicy and filling",
  "No pork, I'm craving chicken",
  "Light lunch under $12",
  "Vegetarian options please",
  "Sweet treat to share",
];

function RecommendPage() {
  const { data } = useSuspenseQuery(menuQuery);
  const recommend = useServerFn(recommendDishes);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);

  async function submit(text = prompt) {
    if (text.trim().length < 3 || loading) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await recommend({ data: { prompt: text } }));
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="eyebrow text-primary">AI food guide</p>
      <h1 className="mt-2 font-display text-5xl font-black uppercase">Find your dish</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Tell us what you're craving or any dietary needs — we'll pick the best Miami Grill dishes for you and explain why.
      </p>

      <form className="mt-8 space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="e.g. I love spicy food, no dairy, and I'm really hungry"
        />
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button key={ex} type="button" onClick={() => { setPrompt(ex); submit(ex); }}
              className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">
              {ex}
            </button>
          ))}
        </div>
        <Button type="submit" disabled={loading || prompt.trim().length < 3} className="font-display font-bold uppercase">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {loading ? "Finding dishes…" : "Recommend dishes"}
        </Button>
      </form>

      {result && !result.ok && <p className="mt-8 rounded-lg border border-destructive/50 p-4 text-destructive">{result.error}</p>}
      {result?.ok && (
        <section className="mt-10">
          <p className="text-lg">{result.intro}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {result.picks.map((p) => {
              const item = data.items.find((i) => i.id === p.item_id);
              if (!item) return null;
              return (
                <div key={p.item_id} className="space-y-3">
                  <p className="rounded-lg border-l-4 border-primary bg-card p-3 text-sm"><Sparkles className="mr-1 inline size-4 text-primary" />{p.reason}</p>
                  <MenuItemCard item={item} />
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Suggestions are AI-generated. For allergies, please confirm ingredients with our staff.</p>
        </section>
      )}
    </div>
  );
}
