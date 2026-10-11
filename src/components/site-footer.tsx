import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { Logo } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">Gyros, burgers, wings & Philly cheesesteaks — the best in the galaxy.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="eyebrow text-primary">Visit</p>
          <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="block hover:text-primary">{SITE.address}</a>
          <a href={SITE.phoneHref} className="block hover:text-primary">{SITE.phone}</a>
        </div>
        <div className="space-y-2 text-sm">
          <p className="eyebrow text-primary">Hours</p>
          {SITE.hours.map((h) => (
            <p key={h.days} className="flex justify-between gap-4 text-muted-foreground">
              <span>{h.days}</span>
              <span className="text-foreground">{h.time}</span>
            </p>
          ))}
          <div className="flex gap-4 pt-2">
            <Link to="/menu" className="text-primary hover:underline">Order online</Link>
            <a href={SITE.nutritionPdf} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">Nutrition info</a>
          </div>
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Miami Grill Lauderhill</p>
    </footer>
  );
}
