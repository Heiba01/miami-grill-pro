import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Category, MenuItem } from "@/lib/menu.functions";
import { money } from "@/lib/site";

type Draft = Partial<MenuItem> & { price?: number };

export function AdminMenu() {
  const qc = useQueryClient();
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [newCat, setNewCat] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [c, i] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    setCats(c.data ?? []);
    setItems(i.data ?? []);
    qc.invalidateQueries({ queryKey: ["menu"] });
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!draft?.name) return toast.error("Name is required");
    const row = {
      name: draft.name, description: draft.description ?? "", price: Number(draft.price ?? 0),
      category_id: draft.category_id ?? cats[0]?.id ?? null, image_url: draft.image_url ?? null,
      available: draft.available ?? true, featured: draft.featured ?? false,
    };
    const { error } = draft.id ? await supabase.from("menu_items").update(row).eq("id", draft.id) : await supabase.from("menu_items").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Menu saved");
    setDraft(null);
    load();
  }

  async function quick(id: string, patch: Partial<MenuItem>) {
    const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
    if (error) toast.error(error.message); else load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this item from the menu?")) return;
    await supabase.from("menu_items").delete().eq("id", id);
    load();
  }

  async function addCat() {
    if (!newCat.trim()) return;
    await supabase.from("categories").insert({ name: newCat.trim(), sort_order: cats.length + 1 });
    setNewCat("");
    load();
  }

  async function upload(file: File) {
    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
    const up = await supabase.storage.from("menu-images").upload(path, file);
    if (up.error) { setUploading(false); return toast.error(up.error.message); }
    const { data, error } = await supabase.storage.from("menu-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setUploading(false);
    if (error) return toast.error(error.message);
    setDraft((d) => ({ ...d, image_url: data.signedUrl }));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setDraft({ available: true, category_id: cats[0]?.id })}><Plus /> Add meal</Button>
        <div className="ml-auto flex gap-2">
          <Input placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} className="w-56" />
          <Button variant="outline" onClick={addCat}>Add category</Button>
        </div>
      </div>

      {cats.map((c) => {
        const list = items.filter((i) => i.category_id === c.id);
        return (
          <section key={c.id}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-black uppercase">{c.name}</h3>
              {list.length === 0 && <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("categories").delete().eq("id", c.id); load(); }}>Remove empty category</Button>}
            </div>
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {list.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center gap-4 p-3">
                  {i.image_url ? <img src={i.image_url} alt="" className="size-12 rounded object-cover" /> : <div className="size-12 rounded bg-muted" />}
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-sm text-primary">{money(Number(i.price))}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={i.available} onCheckedChange={(v) => quick(i.id, { available: v })} /> In stock</label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={i.featured} onCheckedChange={(v) => quick(i.id, { featured: v })} /> Homepage</label>
                  <Button size="icon" variant="ghost" onClick={() => setDraft({ ...i, price: Number(i.price) })} aria-label="Edit"><Pencil /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(i.id)} aria-label="Delete"><Trash2 /></Button>
                </div>
              ))}
              {list.length === 0 && <p className="p-3 text-sm text-muted-foreground">No meals yet.</p>}
            </div>
          </section>
        );
      })}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? "Edit meal" : "Add a meal"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Name</Label><Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Price ($)</Label><Input type="number" step="0.01" min="0" value={draft.price ?? ""} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select value={draft.category_id ?? ""} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Photo</Label>
                <div className="flex items-center gap-3">
                  {draft.image_url && <img src={draft.image_url} alt="" className="size-16 rounded object-cover" />}
                  <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </div>
                {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
              </div>
              <Button className="w-full" onClick={save} disabled={uploading}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
