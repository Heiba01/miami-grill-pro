import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];

export const listMenu = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const [cats, items] = await Promise.all([
    sb.from("categories").select("*").order("sort_order"),
    sb.from("menu_items").select("*").order("sort_order"),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (items.error) throw new Error(items.error.message);
  return { categories: cats.data, items: items.data };
});

export const menuQuery = queryOptions({ queryKey: ["menu"], queryFn: () => listMenu() });
