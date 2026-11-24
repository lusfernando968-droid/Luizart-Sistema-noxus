export const INVENTORY_CATEGORIES = [
  "Agulhas & Cartuchos",
  "Tintas & Pigmentos",
  "Descartáveis & EPI",
  "Higienização & Cuidados",
  "Equipamentos & Outros",
] as const;

export const INVENTORY_UNITS = [
  { value: "un", label: "Unidade (un)" },
  { value: "cx", label: "Caixa (cx)" },
  { value: "pct", label: "Pacote (pct)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "frasco", label: "Frasco" },
  { value: "par", label: "Par" },
  { value: "rolo", label: "Rolo" },
] as const;

export type InventoryMovementType = "entrada" | "saida" | "ajuste";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  batch_number: string;
  expiration_date: string | null;
  supplier: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  item_name: string;
  movement_type: InventoryMovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost: number;
  total_cost: number;
  batch_number: string;
  expiration_date: string | null;
  reason: string;
  financial_transaction_id: string | null;
  created_at: string;
}

export type ExpirationStatus = "none" | "expired" | "expiring" | "valid";

export function parseLocalDate(isoDate: string): Date | null {
  const clean = isoDate.trim().slice(0, 10);
  const parts = clean.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatIsoDateBR(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const clean = isoDate.trim().slice(0, 10);
  const parts = clean.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getExpirationStatus(
  expirationDate: string | null | undefined,
  referenceDate: Date = new Date()
): { status: ExpirationStatus; daysLeft: number | null } {
  if (!expirationDate) return { status: "none", daysLeft: null };
  const target = parseLocalDate(expirationDate);
  if (!target) return { status: "none", daysLeft: null };

  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return { status: "expired", daysLeft: diffDays };
  if (diffDays <= 30) return { status: "expiring", daysLeft: diffDays };
  return { status: "valid", daysLeft: diffDays };
}

export function isLowStock(item: Pick<InventoryItem, "quantity" | "min_quantity">): boolean {
  return Number(item.quantity) <= Number(item.min_quantity);
}

export function formatCurrencyBRL(value: number): string {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatQuantity(qty: number, unit: string): string {
  const num = Number(qty || 0);
  const formatted = Number.isInteger(num) ? String(num) : num.toLocaleString("pt-BR");
  return `${formatted} ${unit}`;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}
