import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { cartTotals, money } from "@/lib/site";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Order — Miami Grill Lauderhill" },
      { name: "description", content: "Review your order and checkout for pickup at Miami Grill." },
      { property: "og:title", content: "Your Order — Miami Grill" },
      { property: "og:description", content: "Checkout for pickup at Miami Grill Lauderhill." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = cartTotals(lines);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("ASAP");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.full_name) setName((n) => n || data.full_name!);
      if (data?.phone) setPhone((p) => p || data.phone!);
    });
  }, [user]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      _items: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
      _customer_name: name,
      _phone: phone,
      _notes: notes,
      _pickup_time: pickup,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);
    clear();
    toast.success("Order placed! We're on it.");
    navigate({ to: "/orders/$id", params: { id: data as string } });
  }

  if (lines.length === 0)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-black uppercase">Your order is empty</h1>
        <p className="mt-3 text-muted-foreground">Hungry? Pick something off the grill.</p>
        <Button asChild className="mt-8 font-display font-bold uppercase"><Link to="/menu">Browse menu</Link></Button>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_400px]">
      <div>
        <h1 className="font-display text-4xl font-black uppercase">Your order</h1>
        <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center gap-4 p-4">
              {l.image_url && <img src={l.image_url} alt="" className="size-16 rounded-lg object-cover" />}
              <div className="flex-1">
                <p className="font-display font-bold uppercase">{l.name}</p>
                <p className="text-sm text-muted-foreground">{money(l.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={() => setQty(l.id, l.quantity - 1)} aria-label="Less"><Minus /></Button>
                <span className="w-8 text-center font-bold">{l.quantity}</span>
                <Button size="icon" variant="outline" onClick={() => setQty(l.id, l.quantity + 1)} aria-label="More"><Plus /></Button>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setQty(l.id, 0)} aria-label="Remove"><Trash2 /></Button>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-black uppercase">Pickup checkout</h2>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(t.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Tax (7%)</dt><dd>{money(t.tax)}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 text-lg font-bold"><dt>Total</dt><dd className="text-primary">{money(t.total)}</dd></div>
        </dl>
        {!user ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Sign in to place your order, track it live and earn reward points.</p>
            <Button asChild className="w-full font-display font-bold uppercase"><Link to="/auth" search={{ redirect: "/cart" }}>Sign in to checkout</Link></Button>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></div>
            <div className="space-y-1.5"><Label htmlFor="p">Phone</Label><Input id="p" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="t">Pickup time</Label>
              <select id="t" value={pickup} onChange={(e) => setPickup(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                {["ASAP", "In 30 minutes", "In 45 minutes", "In 1 hour"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="no">Notes (optional)</Label><Textarea id="no" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="No onions, extra sauce…" /></div>
            <Button type="submit" disabled={busy} className="h-11 w-full font-display font-bold uppercase shadow-glow">{busy ? "Placing order…" : `Place order · ${money(t.total)}`}</Button>
            <p className="text-center text-xs text-muted-foreground">Pay when you pick up.</p>
          </form>
        )}
      </aside>
    </div>
  );
}
