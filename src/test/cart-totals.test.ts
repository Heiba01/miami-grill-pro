import { describe, expect, it } from "vitest";
import { cartTotals, POINTS_PER_REWARD } from "@/lib/site";

describe("cart totals", () => {
  it("adds 7% Florida sales tax", () => {
    expect(cartTotals([{ price: 10, quantity: 2 }])).toEqual({ subtotal: 20, tax: 1.4, total: 21.4 });
  });
  it("a free meal reward costs 100 points", () => {
    expect(POINTS_PER_REWARD).toBe(100);
  });
});
