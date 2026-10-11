import { Plus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/site";
import type { MenuItem } from "@/lib/menu.functions";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { add } = useCart();
  const price = Number(item.price);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
      <div className="aspect-square overflow-hidden bg-muted">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground"><UtensilsCrossed className="size-10" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-bold uppercase leading-tight">{item.name}</h3>
          <span className="font-display font-bold text-primary">{money(price)}</span>
        </div>
        <p className="flex-1 text-sm text-muted-foreground">{item.description}</p>
        <Button
          className="mt-2 w-full font-display font-bold uppercase"
          disabled={!item.available}
          onClick={() => {
            add({ id: item.id, name: item.name, price, image_url: item.image_url });
            toast.success(`${item.name} added to your order`);
          }}
        >
          {item.available ? (<><Plus /> Add to order</>) : "Sold out today"}
        </Button>
      </div>
    </article>
  );
}
