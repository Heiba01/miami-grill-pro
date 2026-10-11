import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Clock, MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItemCard } from "@/components/menu-item-card";
import { menuQuery } from "@/lib/menu.functions";
import { SITE, POINTS_PER_REWARD } from "@/lib/site";

const TITLE = "Miami Grill Lauderhill — Best Gyros, Burgers & Wings in the Galaxy";
const DESC = "Order gyros, burgers, chicken wings and Philly cheesesteaks online for pickup at Miami Grill, 5001 N University Dr, Lauderhill. Open late every night.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:image", content: SITE.heroImage },
      { name: "twitter:image", content: SITE.heroImage },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery),
  component: Home,
});

const WORDS = ["Gyro", "Burger", "Chicken Wings", "Philly Sandwich", "Dining"];

function Home() {
  const { data } = useSuspenseQuery(menuQuery);
  const featured = data.items.filter((i) => i.featured).slice(0, 6);
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setW((x) => (x + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={SITE.heroImage} alt="Miami Grill restaurant in Lauderhill" className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-fade" />
        <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center gap-6 px-4 py-20">
          <span className="eyebrow w-fit rounded bg-primary px-3 py-1.5 text-primary-foreground">Lauderhill · Open late</span>
          <h1 className="max-w-3xl font-display text-5xl font-black uppercase leading-[0.95] md:text-7xl">
            Best{" "}
            <span key={w} className="inline-block animate-in fade-in slide-in-from-bottom-3 text-primary duration-500">{WORDS[w]}</span>
            <br />in the Galaxy
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">Fresh off the grill, made to order. Order ahead and skip the line — your food will be hot and waiting.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-8 font-display font-bold uppercase shadow-glow"><Link to="/menu">Order now</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 font-display font-bold uppercase"><a href={SITE.phoneHref}><Phone /> Call us</a></Button>
          </div>
        </div>
      </section>

      <section className="bg-pink-gradient">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-primary-foreground md:grid-cols-3">
          <InfoItem icon={<MapPin />} title="Find us" text={SITE.address} href={SITE.mapsUrl} />
          <InfoItem icon={<Clock />} title="Open late" text="Daily 10 AM – 2 AM · Fri & Sat till 3 AM" />
          <InfoItem icon={<Phone />} title="Call" text={SITE.phone} href={SITE.phoneHref} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Fan favorites</p>
            <h2 className="mt-2 font-display text-4xl font-black uppercase">Straight off the grill</h2>
          </div>
          <Button asChild variant="outline" className="font-display font-bold uppercase"><Link to="/menu">View full menu</Link></Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((i) => <MenuItemCard key={i.id} item={i} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-8 overflow-hidden rounded-2xl border border-border bg-card p-8 md:grid-cols-[1fr_auto] md:p-12">
          <div>
            <p className="eyebrow text-palm">Miami Grill Rewards</p>
            <h2 className="mt-2 font-display text-3xl font-black uppercase md:text-4xl">Eat. Earn. Repeat.</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">Earn 1 point for every dollar you spend online. Every {POINTS_PER_REWARD} points gets you a free meal reward.</p>
          </div>
          <Button asChild size="lg" className="h-12 font-display font-bold uppercase"><Link to="/rewards"><Star /> Join rewards</Link></Button>
        </div>
      </section>
    </>
  );
}

function InfoItem({ icon, title, text, href }: { icon: React.ReactNode; title: string; text: string; href?: string }) {
  const body = (
    <div className="flex items-center gap-4">
      <div className="rounded-full bg-background/15 p-3 [&_svg]:size-5">{icon}</div>
      <div>
        <p className="eyebrow opacity-80">{title}</p>
        <p className="font-semibold">{text}</p>
      </div>
    </div>
  );
  return href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{body}</a> : body;
}
