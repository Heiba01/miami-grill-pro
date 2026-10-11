import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POINTS_PER_REWARD } from "@/lib/site";

type P = { id: string; full_name: string | null; email: string | null; phone: string | null; loyalty_points: number };

export function AdminCustomers({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<P[]>([]);
  const [staff, setStaff] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  async function load() {
    const { data } = await supabase.from("profiles").select("id, full_name, email, phone, loyalty_points").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
    if (isAdmin) {
      const r = await supabase.from("user_roles").select("user_id, role").in("role", ["staff", "admin"]);
      setStaff(new Set((r.data ?? []).map((x) => x.user_id)));
    }
  }
  useEffect(() => { load(); }, []);

  async function adjust(p: P, delta: number) {
    const { error } = await supabase.from("profiles").update({ loyalty_points: Math.max(0, p.loyalty_points + delta) }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success(delta < 0 ? "Reward redeemed" : "Points added"); load(); }
  }
  async function toggleStaff(p: P) {
    const { error } = staff.has(p.id)
      ? await supabase.from("user_roles").delete().eq("user_id", p.id).eq("role", "staff")
      : await supabase.from("user_roles").insert({ user_id: p.id, role: "staff" });
    if (error) toast.error(error.message); else load();
  }

  const shown = rows.filter((r) => [r.full_name, r.email, r.phone].some((v) => v?.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-4">
      <Input placeholder="Search by name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {shown.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-4 p-3">
            <div className="min-w-48 flex-1">
              <p className="font-semibold">{p.full_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{p.email} {p.phone && `· ${p.phone}`}</p>
            </div>
            <span className="font-display font-black text-primary">{p.loyalty_points} pts</span>
            <Button size="sm" variant="outline" onClick={() => adjust(p, 10)}>+10</Button>
            <Button size="sm" disabled={p.loyalty_points < POINTS_PER_REWARD} onClick={() => adjust(p, -POINTS_PER_REWARD)}>Redeem free meal</Button>
            {isAdmin && <Button size="sm" variant="ghost" onClick={() => toggleStaff(p)}>{staff.has(p.id) ? "Remove staff" : "Make staff"}</Button>}
          </div>
        ))}
        {shown.length === 0 && <p className="p-4 text-sm text-muted-foreground">No customers yet.</p>}
      </div>
    </div>
  );
}
