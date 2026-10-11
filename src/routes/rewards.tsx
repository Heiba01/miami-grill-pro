import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { POINTS_PER_REWARD } from "@/lib/site";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — Miami Grill Lauderhill" },
      { name: "description", content: "Earn 1 point per dollar on online orders at Miami Grill and redeem for free food." },
      { property: "og:title", content: "Miami Grill Rewards" },
      { property: "og:description", content: "Earn points on every online order and get free food." },
    ],
  }),
  component: Rewards,
});

function Rewards() {
  const { user } = useAuth();
  const steps = [
    { icon: <ShoppingBag />, t: "Order online", d: "Place your pickup order through the website." },
    { icon: <Star />, t: "Earn points", d: "Get 1 point for every $1 once you pick up your food." },
    { icon: <Gift />, t: "Get free food", d: `Every ${POINTS_PER_REWARD} points earns a free meal — just show your account at the counter.` },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <p className="eyebrow text-palm">Miami Grill Rewards</p>
      <h1 className="mt-2 font-display text-5xl font-black uppercase">Eat. Earn. Repeat.</h1>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.t} className="rounded-xl border border-border bg-card p-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground [&_svg]:size-6">{s.icon}</div>
            <h2 className="mt-4 font-display text-lg font-black uppercase">{s.t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
      <Button asChild size="lg" className="mt-12 h-12 px-10 font-display font-bold uppercase shadow-glow">
        {user ? <Link to="/account">See my points</Link> : <Link to="/auth" search={{ redirect: "/account" }}>Join free</Link>}
      </Button>
    </div>
  );
}
