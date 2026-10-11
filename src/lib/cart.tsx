import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartLine = { id: string; name: string; price: number; image_url: string | null; quantity: number };

type CartCtx = {
  lines: CartLine[];
  count: number;
  add: (item: Omit<CartLine, "quantity">) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "mg-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const add: CartCtx["add"] = (item) =>
    setLines((prev) => {
      const f = prev.find((l) => l.id === item.id);
      if (f) return prev.map((l) => (l.id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { ...item, quantity: 1 }];
    });
  const setQty: CartCtx["setQty"] = (id, qty) =>
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, quantity: qty } : l))));
  const clear = () => setLines([]);

  return (
    <Ctx.Provider value={{ lines, count: lines.reduce((s, l) => s + l.quantity, 0), add, setQty, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
