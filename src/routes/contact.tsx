import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Hours — Miami Grill Lauderhill" },
      { name: "description", content: "Miami Grill, 5001 N University Dr, Lauderhill FL 33351. Call (954) 748-0900. Open daily till 2 AM, Fri–Sat till 3 AM." },
      { property: "og:title", content: "Contact Miami Grill Lauderhill" },
      { property: "og:description", content: "Address, phone and hours for Miami Grill in Lauderhill, FL." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
      <div className="space-y-8">
        <div>
          <p className="eyebrow text-primary">Come hungry</p>
          <h1 className="mt-2 font-display text-5xl font-black uppercase">Visit us</h1>
        </div>
        <div className="flex gap-4"><MapPin className="mt-1 text-primary" /><div><p className="font-bold">{SITE.address}</p><a className="text-sm text-primary underline" href={SITE.mapsUrl} target="_blank" rel="noreferrer">Get directions</a></div></div>
        <div className="flex gap-4"><Phone className="mt-1 text-primary" /><a href={SITE.phoneHref} className="font-bold">{SITE.phone}</a></div>
        <div className="flex gap-4"><Clock className="mt-1 text-primary" /><div className="space-y-1">{SITE.hours.map((h) => <p key={h.days}><span className="text-muted-foreground">{h.days}:</span> <b>{h.time}</b></p>)}</div></div>
        <Button asChild size="lg" className="font-display font-bold uppercase"><a href={SITE.phoneHref}>Call for catering</a></Button>
      </div>
      <iframe
        title="Map to Miami Grill"
        className="min-h-96 w-full rounded-xl border border-border"
        loading="lazy"
        src="https://www.google.com/maps?q=5001+N+University+Dr+Lauderhill+FL+33351&output=embed"
      />
    </div>
  );
}
