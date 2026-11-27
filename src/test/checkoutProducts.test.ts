import { describe, expect, it } from "vitest";
import {
  buildSelectedCheckoutProducts,
  calculateProductsTotal,
  formatCheckoutProductsSummary,
  formatCheckoutProductsWithTotal,
  validateCheckoutProductStock,
} from "@/lib/checkoutProducts";
import type { InventoryItem } from "@/lib/inventory";

const SAMPLE_ITEMS: InventoryItem[] = [
  {
    id: "item-1",
    name: "Pomada Anestésica",
    category: "Produtos / Pós-sessão",
    unit: "un",
    quantity: 5,
    min_quantity: 2,
    unit_cost: 30,
    is_sellable: true,
    sale_price: 80,
    batch_number: "",
    expiration_date: null,
    supplier: "",
    notes: "",
  },
  {
    id: "item-2",
    name: "Noplast",
    category: "Produtos / Pós-sessão",
    unit: "un",
    quantity: 3,
    min_quantity: 1,
    unit_cost: 20,
    is_sellable: true,
    sale_price: 60,
    batch_number: "",
    expiration_date: null,
    supplier: "",
    notes: "",
  },
];

describe("checkout products helpers", () => {
  it("builds selected items with fixed prices and computes totals", () => {
    const selected = buildSelectedCheckoutProducts(SAMPLE_ITEMS, {
      "item-1": 2,
      "item-2": 1,
    });

    expect(selected).toHaveLength(2);
    expect(selected[0]).toMatchObject({
      item_id: "item-1",
      quantity: 2,
      unit_price: 80,
      total_price: 160,
      unit_cost: 30,
    });
    expect(calculateProductsTotal(selected)).toBe(220);
    expect(formatCheckoutProductsSummary(selected)).toBe(
      "2x Pomada Anestésica, 1x Noplast"
    );
    expect(formatCheckoutProductsWithTotal(selected)).toContain("2x Pomada Anestésica");
  });

  it("validates available stock before completing checkout", () => {
    const selected = buildSelectedCheckoutProducts(SAMPLE_ITEMS, {
      "item-1": 6,
    });

    expect(validateCheckoutProductStock(selected, SAMPLE_ITEMS)).toBe(
      "Estoque insuficiente para Pomada Anestésica (disponível: 5 un)."
    );

    const validSelected = buildSelectedCheckoutProducts(SAMPLE_ITEMS, {
      "item-1": 5,
      "item-2": 2,
    });
    expect(validateCheckoutProductStock(validSelected, SAMPLE_ITEMS)).toBeNull();
  });
});
