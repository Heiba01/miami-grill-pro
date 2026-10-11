import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const safe = (r?: string) => (r && r.startsWith("/") && !r.startsWith("//") ? r : "/account");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — Miami Grill Lauderhill" },
      { name: "description", content: "Sign in or create a Miami Grill account to order online and earn rewards." },
      { property: "og:title", content: "Sign in — Miami Grill" },
      { property: "og:description", content: "Order online and earn rewards at Miami Grill." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: safe(redirect) });
  }, [user, redirect, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + safe(redirect), data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset link sent.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth?redirect=" + encodeURIComponent(safe(redirect)) });
    if (r.error) toast.error(r.error.message);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-display text-4xl font-black uppercase">
        {mode === "in" ? "Welcome back" : mode === "up" ? "Join Miami Grill" : "Reset password"}
      </h1>
      <p className="mt-2 text-center text-muted-foreground">Order faster, track your food and earn rewards.</p>
      <div className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
        {mode !== "forgot" && (
          <>
            <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
            <div className="text-center text-xs uppercase text-muted-foreground">or</div>
          </>
        )}
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && <div className="space-y-1.5"><Label htmlFor="nm">Name</Label><Input id="nm" required value={name} onChange={(e) => setName(e.target.value)} /></div>}
          <div className="space-y-1.5"><Label htmlFor="em">Email</Label><Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {mode !== "forgot" && <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>}
          <Button type="submit" disabled={busy} className="w-full font-display font-bold uppercase">
            {mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
          </Button>
        </form>
        <div className="flex justify-between text-sm">
          <button className="text-primary hover:underline" onClick={() => setMode(mode === "up" ? "in" : "up")}>{mode === "up" ? "Have an account? Sign in" : "New here? Create account"}</button>
          {mode === "in" && <button className="text-muted-foreground hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>}
        </div>
      </div>
    </div>
  );
}
