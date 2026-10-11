import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/order-status";
import { useAuth } from "@/lib/auth";
import { money, POINTS_PER_REWARD } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Account — Miami Grill" },
      { name: "description", content: "Your Miami Grill orders and reward points." },
      { property: "og:title", content: "My Account — Miami Grill" },
      { property: "og:description", content: "Your Miami Grill orders and reward points." },
    ],
  }),
  component: Account,
});

type Order = { id: string; order_number: number; status: string; total: number; created_at: string };

function Account() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [name, setName] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, loyalty_points").eq("id", user.id).maybeSingle().then(({ data }) => {
      setPoints(data?.loyalty_points ?? 0);
      setName(data?.full_name ?? null);
    });
    supabase.from("orders").select("id, order_number, status, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  const progress = points % POINTS_PER_REWARD;
  const rewards = Math.floor(points / POINTS_PER_REWARD);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-black uppercase">Hi{name ? `, ${name.split(" ")[0]}` : ""}</h1>
        <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}><LogOut /> Sign out</Button>
      </div>

      <div className="mt-8 rounded-2xl bg-pink-gradient p-8 text-primary-foreground">
        <p className="eyebrow opacity-80">Reward points</p>
        <p className="mt-1 flex items-center gap-3 font-display text-6xl font-black"><Star className="size-10" />{points}</p>
        <Progress value={progress} className="mt-6 bg-background/20" />
        <p className="mt-2 text-sm opacity-90">
          {POINTS_PER_REWARD - progress} points to your next free meal{rewards > 0 && ` · ${rewards} reward${rewards > 1 ? "s" : ""} ready — show this at the counter`}
        </p>
      </div>

      <h2 className="mt-12 font-display text-2xl font-black uppercase">Your orders</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No orders yet. <Link to="/menu" className="text-primary underline">Start one</Link></p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to="/orders/$id" params={{ id: o.id }} className="flex items-center justify-between gap-4 p-4 hover:bg-accent">
                <div>
                  <p className="font-display font-bold">Order #{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4"><StatusBadge status={o.status} /><span className="font-bold">{money(Number(o.total))}</span></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
