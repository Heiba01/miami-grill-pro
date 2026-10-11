import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { id: string; body: string; from_staff: boolean; created_at: string };

export function OrderChat({ orderId, asStaff }: { orderId: string; asStaff: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("order_messages").select("id, body, from_staff, created_at").eq("order_id", orderId).order("created_at")
      .then(({ data }) => setMsgs(data ?? []));
    const ch = supabase
      .channel(`msgs-${orderId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_messages", filter: `order_id=eq.${orderId}` }, (p) =>
        setMsgs((m) => (m.some((x) => x.id === (p.new as Msg).id) ? m : [...m, p.new as Msg])),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orderId]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const { data, error } = await supabase.from("order_messages").insert({ order_id: orderId, body, from_staff: asStaff }).select("id, body, from_staff, created_at").single();
    if (!error && data) setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="max-h-72 min-h-32 space-y-2 overflow-y-auto p-4">
        {msgs.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet.</p>}
        {msgs.map((m) => {
          const mine = m.from_staff === asStaff;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                <p className="text-[10px] uppercase opacity-70">{m.from_staff ? "Miami Grill" : "Customer"}</p>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={asStaff ? "Message the customer…" : "Message the restaurant…"} maxLength={1000} />
        <Button type="submit" size="icon" aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}
