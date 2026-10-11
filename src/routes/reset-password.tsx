import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Miami Grill" },
      { name: "description", content: "Choose a new password for your Miami Grill account." },
      { property: "og:title", content: "Reset password — Miami Grill" },
      { property: "og:description", content: "Choose a new password for your Miami Grill account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/account" });
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 px-4 py-16">
      <h1 className="font-display text-3xl font-black uppercase">New password</h1>
      <Input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" />
      <Button type="submit" className="w-full">Save password</Button>
    </form>
  );
}
