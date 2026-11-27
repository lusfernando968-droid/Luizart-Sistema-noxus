import { supabase } from "@/lib/supabase";
import { formatCurrencyBRL, type InventoryItem } from "@/lib/inventory";

export interface CheckoutProductSelection {
  item_id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_cost: number;
}

export function buildSelectedCheckoutProducts(
  sellableItems: InventoryItem[],
  quantities: Record<string, number>
): CheckoutProductSelection[] {
  const selected: CheckoutProductSelection[] = [];

  for (const item of sellableItems) {
    const qty = Number(quantities[item.id] || 0);
    if (qty <= 0) continue;

    const unitPrice = Number(item.sale_price || 0);
    selected.push({
      item_id: item.id,
      name: item.name,
      unit: item.unit || "un",
      quantity: qty,
      unit_price: unitPrice,
      total_price: Number((qty * unitPrice).toFixed(2)),
      unit_cost: Number(item.unit_cost || 0),
    });
  }

  return selected;
}

export function calculateProductsTotal(
  selected: Pick<CheckoutProductSelection, "total_price">[]
): number {
  const total = selected.reduce(
    (sum, item) => sum + (Number(item.total_price) || 0),
    0
  );
  return Number(total.toFixed(2));
}

export function formatCheckoutProductsSummary(
  products: Pick<CheckoutProductSelection, "name" | "quantity">[]
): string {
  return products
    .map((p) => `${p.quantity}x ${p.name}`)
    .join(", ");
}

export function formatCheckoutProductsWithTotal(
  products: CheckoutProductSelection[] | null | undefined
): string {
  if (!Array.isArray(products) || products.length === 0) return "";
  const names = formatCheckoutProductsSummary(products);
  const total = calculateProductsTotal(products);
  return total > 0 ? `${names} (${formatCurrencyBRL(total)})` : names;
}

export function validateCheckoutProductStock(
  selected: CheckoutProductSelection[],
  availableItems: Pick<InventoryItem, "id" | "name" | "quantity" | "unit">[]
): string | null {
  const map = new Map(availableItems.map((i) => [i.id, i]));

  for (const item of selected) {
    const stockItem = map.get(item.item_id);
    if (!stockItem) {
      return `Produto "${item.name}" não encontrado no estoque.`;
    }
    const available = Number(stockItem.quantity) || 0;
    if (item.quantity > available) {
      return `Estoque insuficiente para ${item.name} (disponível: ${available} ${stockItem.unit || item.unit}).`;
    }
  }

  return null;
}

export interface ProcessCheckoutProductsParams {
  appointmentId: string;
  clientName: string;
  checkoutStatus: string;
  selectedProducts: CheckoutProductSelection[];
  driveLink?: string;
  saleDate?: string;
}

export async function processCheckoutAdditionalProducts({
  appointmentId,
  clientName,
  checkoutStatus,
  selectedProducts,
  driveLink = "",
  saleDate = new Date().toISOString().split("T")[0],
}: ProcessCheckoutProductsParams): Promise<{
  productsTotal: number;
  financialTransactionId: string | null;
}> {
  if (selectedProducts.length === 0) {
    return { productsTotal: 0, financialTransactionId: null };
  }

  const ids = selectedProducts.map((p) => p.item_id);
  const { data: freshItems, error: fetchError } = await supabase
    .from("inventory_items")
    .select("id, name, unit, quantity, unit_cost, batch_number, expiration_date")
    .in("id", ids);

  if (fetchError) throw fetchError;

  const stockValidationError = validateCheckoutProductStock(
    selectedProducts,
    (freshItems || []) as Pick<InventoryItem, "id" | "name" | "quantity" | "unit">[]
  );
  if (stockValidationError) {
    throw new Error(stockValidationError);
  }

  const productsTotal = calculateProductsTotal(selectedProducts);
  let createdFinancialId: string | null = null;

  if (checkoutStatus !== "Permuta" && productsTotal > 0) {
    const { data: finData, error: finError } = await supabase
      .from("financial_transactions")
      .insert([
        {
          description: `Produtos Adicionais - ${clientName}: ${formatCheckoutProductsSummary(
            selectedProducts
          )}`,
          type: "entrada",
          value: productsTotal,
          date: saleDate,
          status: "Pago",
          category: "produto",
          drive_link: driveLink,
          appointment_id: appointmentId,
        },
      ])
      .select("id")
      .single();

    if (finError) throw finError;
    createdFinancialId = finData?.id ?? null;
  }

  const freshMap = new Map((freshItems || []).map((i: any) => [i.id, i]));
  const nowIso = new Date().toISOString();

  for (const sel of selectedProducts) {
    const fresh = freshMap.get(sel.item_id);
    if (!fresh) continue;

    const previousQty = Number(fresh.quantity) || 0;
    const newQty = Math.max(0, Number((previousQty - sel.quantity).toFixed(4)));
    const unitCost = Number(fresh.unit_cost) || 0;

    const { error: updateErr } = await supabase
      .from("inventory_items")
      .update({
        quantity: newQty,
        updated_at: nowIso,
      })
      .eq("id", fresh.id);

    if (updateErr) throw updateErr;

    const { error: movErr } = await supabase
      .from("inventory_movements")
      .insert([
        {
          item_id: fresh.id,
          item_name: fresh.name,
          movement_type: "saida",
          quantity: sel.quantity,
          previous_quantity: previousQty,
          new_quantity: newQty,
          unit_cost: unitCost,
          total_cost: Number((sel.quantity * unitCost).toFixed(2)),
          batch_number: fresh.batch_number || "",
          expiration_date: fresh.expiration_date || null,
          reason: `Venda na baixa — ${clientName}`,
          financial_transaction_id: createdFinancialId,
        },
      ]);

    if (movErr) throw movErr;
  }

  return {
    productsTotal,
    financialTransactionId: createdFinancialId,
  };
}
