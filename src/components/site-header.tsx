import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, LayoutDashboard, Phone } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/site";
import logoAsset from "@/assets/mg-logo.png.asset.json";

export function Logo() {
  return (
    <Link to="/" className="flex items-center" aria-label="Miami Grill home">
      <img src={logoAsset.url} alt="Miami Grill" className="h-11 w-auto" />
    </Link>
  );
}

const nav = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/rewards", label: "Rewards" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { user, isStaff } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden flex-1 items-center gap-6 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a href={SITE.phoneHref} className="hidden items-center gap-2 px-3 text-sm text-muted-foreground hover:text-foreground lg:flex">
            <Phone className="size-4" /> {SITE.phone}
          </a>
          {isStaff && (
            <Link to="/admin" className="rounded-md p-2 text-palm hover:bg-accent" aria-label="Staff dashboard">
              <LayoutDashboard className="size-5" />
            </Link>
          )}
          <Link to={user ? "/account" : "/auth"} className="rounded-md p-2 hover:bg-accent" aria-label="Account">
            <User className="size-5" />
          </Link>
          <Link to="/cart" className="relative rounded-md p-2 hover:bg-accent" aria-label="Cart">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <nav className="flex justify-around border-t border-border py-2 md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="font-display text-xs font-semibold uppercase text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: n.to === "/" }}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
