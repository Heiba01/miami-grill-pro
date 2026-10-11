import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Recommendation = { item_id: string; reason: string };
export type RecommendResult =
  | { ok: true; intro: string; picks: Recommendation[] }
  | { ok: false; error: string };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["intro", "picks"],
  properties: {
    intro: { type: "string" },
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item_id", "reason"],
        properties: { item_id: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
};

export const recommendDishes = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string }) => {
    const prompt = String(input?.prompt ?? "").trim().slice(0, 600);
    if (prompt.length < 3) throw new Error("Tell us a little about what you like.");
    return { prompt };
  })
  .handler(async ({ data }): Promise<RecommendResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "AI is not configured yet." };
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (i, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(i, { ...init, headers: h });
        },
      },
    });
    const { data: items, error } = await sb
      .from("menu_items")
      .select("id, name, description, price, available")
      .eq("available", true);
    if (error || !items?.length) return { ok: false, error: "Menu is unavailable right now." };

    const menu = items
      .map((i) => `- id=${i.id} | ${i.name} | $${Number(i.price).toFixed(2)} | ${i.description ?? ""}`)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "You are the friendly food guide at Miami Grill in Lauderhill, FL. Recommend 1-4 dishes ONLY from the provided menu that fit the customer's tastes and dietary needs. Use exact ids. For each, give a short, warm 1-2 sentence reason. Be honest about dietary limits: if nothing fits a strict need (e.g. vegan, gluten-free, allergy), say so in the intro, suggest the closest options, and advise asking staff about ingredients and cross-contact. Never invent dishes.",
        input: `MENU:\n${menu}\n\nCUSTOMER SAYS: ${data.prompt}`,
        text: { format: { type: "json_schema", name: "recommendations", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const msg =
        res.status === 429 ? "We're getting a lot of requests — try again in a moment."
        : res.status === 402 ? "AI suggestions are paused right now (credits needed)."
        : "Couldn't get suggestions right now. Please try again.";
      console.error("AI gateway error", res.status, await res.text().catch(() => ""));
      return { ok: false, error: msg };
    }

    // Consume SSE stream server-side, accumulate output text.
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    let refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
            if (ev.type === "response.refusal.delta") refused = true;
            if (ev.type === "response.failed" || ev.type === "error") {
              return { ok: false, error: "Couldn't get suggestions right now. Please try again." };
            }
          } catch { /* ignore partial */ }
        }
      }
    }
    if (refused) return { ok: false, error: "Sorry, we can't help with that request." };
    try {
      const parsed = JSON.parse(text) as { intro: string; picks: Recommendation[] };
      const ids = new Set(items.map((i) => i.id));
      return { ok: true, intro: parsed.intro, picks: parsed.picks.filter((p) => ids.has(p.item_id)).slice(0, 4) };
    } catch {
      return { ok: false, error: "Couldn't read suggestions. Please try again." };
    }
  });
