import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrderChat } from "@/components/order-chat";
import { STATUS_LABEL } from "@/components/order-status";
import { useAuth } from "@/lib/auth";
import { money, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Status — Miami Grill" },
      { name: "description", content: "Track your Miami Grill pickup order live." },
      { property: "og:title", content: "Order Status — Miami Grill" },
      { property: "og:description", content: "Track your Miami Grill pickup order live." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

type Order = { id: string; order_number: number; status: string; subtotal: number; tax: number; total: number; pickup_time: string | null; notes: string | null };
type Item = { id: string; name: string; price: number; quantity: number };
const STEPS = ["pending", "preparing", "ready", "completed"];

function OrderPage() {
  const { id } = Route.useParams();
  const { isStaff } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    supabase.from("orders").select("*").eq("id", id).maybeSingle().then(({ data }) => setOrder(data));
    supabase.from("order_items").select("id, name, price, quantity").eq("order_id", id).then(({ data }) => setItems(data ?? []));
    const ch = supabase.channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (p) => setOrder(p.new as Order))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!order) return <div className="py-24 text-center text-muted-foreground">Loading order…</div>;
  const idx = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div>
        <p className="eyebrow text-primary">Pickup · {order.pickup_time ?? "ASAP"}</p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase">Order #{order.order_number}</h1>
      </div>

      {order.status === "cancelled" ? (
        <p className="rounded-xl bg-destructive/15 p-4 text-destructive">This order was cancelled. Call {SITE.phone} with questions.</p>
      ) : (
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-2 text-center">
              <span className={cn("flex size-10 items-center justify-center rounded-full border-2 font-bold", i <= idx ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                {i < idx ? <Check className="size-5" /> : i + 1}
              </span>
              <span className={cn("font-display text-xs font-bold uppercase", i <= idx ? "text-foreground" : "text-muted-foreground")}>{STATUS_LABEL[s]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between text-sm"><span>{i.quantity} × {i.name}</span><span>{money(Number(i.price) * i.quantity)}</span></li>
          ))}
        </ul>
        {order.notes && <p className="mt-3 text-sm text-muted-foreground">Notes: {order.notes}</p>}
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <p className="flex justify-between"><span className="text-muted-foreground">Subtotal</span>{money(Number(order.subtotal))}</p>
          <p className="flex justify-between"><span className="text-muted-foreground">Tax</span>{money(Number(order.tax))}</p>
          <p className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{money(Number(order.total))}</span></p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Pay at pickup · {SITE.address}</p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-black uppercase">Messages</h2>
        <OrderChat orderId={order.id} asStaff={isStaff} />
      </div>
    </div>
  );
}
