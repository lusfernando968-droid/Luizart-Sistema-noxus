import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InventoryItemModal } from "@/components/inventory/InventoryItemModal";
import { supabase } from "@/lib/supabase";
import {
  formatCurrencyBRL,
  formatQuantity,
  type InventoryItem,
} from "@/lib/inventory";
import {
  buildSelectedCheckoutProducts,
  calculateProductsTotal,
  type CheckoutProductSelection,
} from "@/lib/checkoutProducts";

interface CheckoutProductsSectionProps {
  open: boolean;
  sessionStatus: string;
  sessionValue: number;
  quantities: Record<string, number>;
  onQuantitiesChange: (
    nextQuantities: Record<string, number>,
    selectedProducts: CheckoutProductSelection[]
  ) => void;
}

export function CheckoutProductsSection({
  open,
  sessionStatus,
  sessionValue,
  quantities,
  onQuantitiesChange,
}: CheckoutProductsSectionProps) {
  const [sellableItems, setSellableItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);

  const fetchSellableItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("is_sellable", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setSellableItems((data || []) as InventoryItem[]);
    } catch (error) {
      console.error("Erro ao carregar produtos adicionais:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSellableItems();
    }
  }, [open, fetchSellableItems]);

  const selectedProducts = useMemo(
    () => buildSelectedCheckoutProducts(sellableItems, quantities),
    [sellableItems, quantities]
  );

  const productsTotal = useMemo(
    () => calculateProductsTotal(selectedProducts),
    [selectedProducts]
  );

  const totalCount = useMemo(
    () => selectedProducts.reduce((sum, item) => sum + item.quantity, 0),
    [selectedProducts]
  );

  const updateItemQty = (item: InventoryItem, delta: number) => {
    const current = Number(quantities[item.id] || 0);
    const maxQty = Math.max(0, Number(item.quantity) || 0);
    const nextQty = Math.max(0, Math.min(maxQty, current + delta));
    const nextMap = { ...quantities };

    if (nextQty <= 0) {
      delete nextMap[item.id];
    } else {
      nextMap[item.id] = nextQty;
    }

    onQuantitiesChange(
      nextMap,
      buildSelectedCheckoutProducts(sellableItems, nextMap)
    );
  };

  const baseSessionAmount =
    sessionStatus === "Recebido" || sessionStatus === "Permuta"
      ? Number(sessionValue || 0)
      : 0;
  const combinedTotal = Number((baseSessionAmount + productsTotal).toFixed(2));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-primary" />
          Produtos Adicionais
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setNewProductModalOpen(true)}
          className="h-7 px-2 text-[11px] font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-lg gap-1"
        >
          <Plus className="w-3 h-3" />
          Novo produto
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
          Carregando produtos...
        </div>
      ) : sellableItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 p-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Nenhum produto adicional no estoque
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setNewProductModalOpen(true)}
            className="h-7 px-2.5 text-[11px] font-semibold rounded-lg shrink-0"
          >
            Cadastrar
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-muted/15 divide-y divide-border/60 max-h-[180px] overflow-y-auto">
          {sellableItems.map((item) => {
            const qty = Number(quantities[item.id] || 0);
            const available = Math.max(0, Number(item.quantity) || 0);
            const outOfStock = available <= 0;
            const unitPrice = Number(item.sale_price || 0);

            return (
              <div
                key={item.id}
                className={`px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                  qty > 0 ? "bg-primary/5" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground/90">
                      {formatCurrencyBRL(unitPrice)}
                    </span>
                    <span>•</span>
                    <span className={outOfStock ? "text-destructive font-medium" : ""}>
                      {outOfStock
                        ? "Sem estoque"
                        : `Estoque: ${formatQuantity(available, item.unit)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={qty <= 0}
                    onClick={() => updateItemQty(item, -1)}
                    className="h-7 w-7 rounded-lg"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-5 text-center text-xs font-bold text-foreground">
                    {qty}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={outOfStock || qty >= available}
                    onClick={() => updateItemQty(item, 1)}
                    className="h-7 w-7 rounded-lg"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProducts.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5 space-y-1 text-xs">
          {baseSessionAmount > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Sessão</span>
              <span className="font-medium text-foreground">
                {formatCurrencyBRL(baseSessionAmount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Produtos ({totalCount})</span>
            <span className="font-medium text-foreground">
              {formatCurrencyBRL(productsTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/60 font-bold text-foreground">
            <span>
              {sessionStatus === "Permuta" ? "Total Abatido" : "Total da Baixa"}
            </span>
            <span className="text-primary">{formatCurrencyBRL(combinedTotal)}</span>
          </div>
        </div>
      )}

      <InventoryItemModal
        open={newProductModalOpen}
        onOpenChange={setNewProductModalOpen}
        editingItem={null}
        defaultSellable={true}
        onSaved={fetchSellableItems}
      />
    </div>
  );
}
