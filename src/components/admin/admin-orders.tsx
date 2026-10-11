import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_LABEL } from "@/components/order-status";
import { OrderChat } from "@/components/order-chat";
import { money } from "@/lib/site";
import { cn } from "@/lib/utils";

type Order = { id: string; order_number: number; customer_name: string; phone: string; status: string; total: number; pickup_time: string | null; notes: string | null; created_at: string };
type Item = { id: string; name: string; quantity: number };
const FLOW = ["pending", "preparing", "ready", "completed"] as const;

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [open, setOpen] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const { data } = await supabase.from("orders").select("id, order_number, customer_name, phone, status, total, pickup_time, notes, created_at").order("created_at", { ascending: false }).limit(100);
    setOrders(data ?? []);
  }
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) => {
        if (p.eventType === "INSERT") toast.success(`New order #${(p.new as Order).order_number}!`);
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  useEffect(() => {
    if (!open) return;
    supabase.from("order_items").select("id, name, quantity").eq("order_id", open).then(({ data }) => setItems(data ?? []));
  }, [open]);

  async function setStatus(id: string, status: (typeof FLOW)[number] | "cancelled") {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
  }

  const shown = orders.filter((o) => filter === "all" || !["completed", "cancelled"].includes(o.status));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-4 flex gap-2">
          <Button size="sm" variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")}>Active</Button>
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
        </div>
        {shown.length === 0 && <p className="text-muted-foreground">No orders right now. New orders appear here instantly.</p>}
        <div className="space-y-3">
          {shown.map((o) => {
            const next = FLOW[FLOW.indexOf(o.status as (typeof FLOW)[number]) + 1];
            return (
              <div key={o.id} onClick={() => setOpen(o.id)} className={cn("cursor-pointer rounded-xl border bg-card p-4 transition-colors", open === o.id ? "border-primary" : "border-border hover:border-primary/50")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg font-black">#{o.order_number} · {o.customer_name}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · Pickup {o.pickup_time} · {money(Number(o.total))}</p>
                <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {next && <Button size="sm" onClick={() => setStatus(o.id, next)}>Mark {STATUS_LABEL[next]}</Button>}
                  {!["completed", "cancelled"].includes(o.status) && <Button size="sm" variant="outline" onClick={() => setStatus(o.id, "cancelled")}>Cancel</Button>}
                  <Button size="sm" variant="ghost" asChild><a href={`tel:${o.phone}`}><Phone /> {o.phone}</a></Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <aside className="space-y-4">
        {open ? (
          <>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="font-display font-black uppercase">Items</p>
              <ul className="mt-2 space-y-1 text-sm">{items.map((i) => <li key={i.id}><b>{i.quantity}×</b> {i.name}</li>)}</ul>
              {orders.find((o) => o.id === open)?.notes && <p className="mt-2 text-sm text-warning">Note: {orders.find((o) => o.id === open)?.notes}</p>}
            </div>
            <OrderChat key={open} orderId={open} asStaff />
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Select an order to see items and message the customer.</p>
        )}
      </aside>
    </div>
  );
}
