import { describe, expect, it } from "vitest";
import {
  formatIsoDateBR,
  formatQuantity,
  getExpirationStatus,
  isLowStock,
} from "@/lib/inventory";

describe("inventory helpers", () => {
  it("detects low stock when quantity is at or below minimum", () => {
    expect(isLowStock({ quantity: 5, min_quantity: 5 })).toBe(true);
    expect(isLowStock({ quantity: 2, min_quantity: 5 })).toBe(true);
    expect(isLowStock({ quantity: 6, min_quantity: 5 })).toBe(false);
  });

  it("classifies expiration status accurately using local date", () => {
    const ref = new Date(2026, 10, 24); // 2026-11-24
    expect(getExpirationStatus(null, ref)).toEqual({
      status: "none",
      daysLeft: null,
    });
    expect(getExpirationStatus("2026-11-23", ref)).toEqual({
      status: "expired",
      daysLeft: -1,
    });
    expect(getExpirationStatus("2026-11-24", ref)).toEqual({
      status: "expiring",
      daysLeft: 0,
    });
    expect(getExpirationStatus("2026-12-24", ref)).toEqual({
      status: "expiring",
      daysLeft: 30,
    });
    expect(getExpirationStatus("2026-12-25", ref)).toEqual({
      status: "valid",
      daysLeft: 31,
    });
  });

  it("formats dates and quantities cleanly", () => {
    expect(formatIsoDateBR("2026-11-24")).toBe("24/11/2026");
    expect(formatIsoDateBR(null)).toBe("—");
    expect(formatQuantity(10, "cx")).toBe("10 cx");
    expect(formatQuantity(2.5, "ml")).toBe("2,5 ml");
  });
});
