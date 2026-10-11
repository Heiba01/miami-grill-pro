export const SITE = {
  name: "Miami Grill",
  address: "5001 N University Dr, Lauderhill, FL 33351",
  phone: "(954) 748-0900",
  phoneHref: "tel:+19547480900",
  mapsUrl: "https://maps.google.com/?q=5001+N+University+Dr+Lauderhill+FL+33351",
  hours: [
    { days: "Sunday – Thursday", time: "10:00 AM – 2:00 AM" },
    { days: "Friday – Saturday", time: "10:00 AM – 3:00 AM" },
  ],
  heroImage:
    "https://miamigrilllauderhill.com/wp-content/uploads/slider/cache/1e9b44e690f8273c44d68ef96e053297/pix-02.jpg",
  nutritionPdf:
    "https://miamigrilllauderhill.com/wp-content/uploads/2025/01/Nutritional-Page-9.1.20.pdf",
  delivery: [
    {
      name: "Uber Eats",
      url: "https://www.ubereats.com/search?q=Miami%20Grill%20Lauderhill",
      blurb: "Fast delivery, tracked to your door",
    },
    {
      name: "DoorDash",
      url: "https://www.doordash.com/search/store/Miami%20Grill%20Lauderhill",
      blurb: "DashPass members save on fees",
    },
    {
      name: "Grubhub",
      url: "https://www.grubhub.com/search?query=Miami%20Grill%20Lauderhill",
      blurb: "Deals and perks on every order",
    },
  ],
};

export const TAX_RATE = 0.07;
export const POINTS_PER_REWARD = 100;

export function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export function cartTotals(lines: { price: number; quantity: number }[]) {
  const subtotal = Math.round(lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}
