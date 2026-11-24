import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import {
  formatQuantity,
  getErrorMessage,
  type InventoryItem,
  type InventoryMovementType,
} from "@/lib/inventory";
import { toast } from "sonner";

interface InventoryMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  initialType: InventoryMovementType;
  onSaved: () => void;
}

export function InventoryMovementModal({
  open,
  onOpenChange,
  item,
  initialType,
  onSaved,
}: InventoryMovementModalProps) {
  const [movementType, setMovementType] =
    useState<InventoryMovementType>(initialType);
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState(0);
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [reason, setReason] = useState("");
  const [launchFinancial, setLaunchFinancial] = useState(false);
  const [expenseValue, setExpenseValue] = useState(0);
  const [expenseDate, setExpenseDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [isDeductible, setIsDeductible] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setMovementType(initialType);
    setQuantity(initialType === "ajuste" ? String(item.quantity) : "1");
    setUnitCost(Number(item.unit_cost) || 0);
    setBatchNumber(item.batch_number || "");
    setExpirationDate(
      item.expiration_date ? item.expiration_date.slice(0, 10) : ""
    );
    setReason("");
    setLaunchFinancial(false);
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setIsDeductible(true);
    setExpenseValue(Number(item.unit_cost) || 0);
  }, [open, item, initialType]);

  useEffect(() => {
    if (movementType === "entrada") {
      const qty = Math.max(0, Number(quantity) || 0);
      setExpenseValue(Number((qty * unitCost).toFixed(2)));
    }
  }, [movementType, quantity, unitCost]);

  if (!item) return null;

  const parsedQty = Number(quantity);
  const currentQty = Number(item.quantity) || 0;
  const previewNewQty =
    movementType === "entrada"
      ? currentQty + (isNaN(parsedQty) ? 0 : parsedQty)
      : movementType === "saida"
        ? currentQty - (isNaN(parsedQty) ? 0 : parsedQty)
        : isNaN(parsedQty)
          ? currentQty
          : parsedQty;

  const handleConfirm = async () => {
    if (isNaN(parsedQty)) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    if (movementType !== "ajuste" && parsedQty <= 0) {
      toast.error("A quantidade deve ser maior que zero.");
      return;
    }
    if (movementType === "ajuste" && parsedQty < 0) {
      toast.error("A quantidade não pode ser negativa.");
      return;
    }
    if (movementType === "saida" && parsedQty > currentQty) {
      toast.error("Saída maior que o estoque atual.");
      return;
    }

    setSaving(true);
    let createdFinancialId: string | null = null;

    try {
      if (movementType === "entrada" && launchFinancial && expenseValue > 0) {
        const { data: finData, error: finError } = await supabase
          .from("financial_transactions")
          .insert([
            {
              description: `Compra Estoque: ${item.name} (${parsedQty} ${item.unit})`,
              value: expenseValue,
              date: expenseDate,
              type: "saida",
              status: "Pago",
              category: null,
              is_deductible: isDeductible,
            },
          ])
          .select("id")
          .single();

        if (finError) throw finError;
        createdFinancialId = finData?.id ?? null;
      }

      const itemUpdate: {
        quantity: number;
        updated_at: string;
        unit_cost?: number;
        batch_number?: string;
        expiration_date?: string | null;
      } = {
        quantity: previewNewQty,
        updated_at: new Date().toISOString(),
      };

      if (movementType === "entrada") {
        itemUpdate.unit_cost = unitCost;
        itemUpdate.batch_number = batchNumber.trim();
        itemUpdate.expiration_date = expirationDate || null;
      }

      const { error: updateError } = await supabase
        .from("inventory_items")
        .update(itemUpdate)
        .eq("id", item.id);

      if (updateError) {
        if (createdFinancialId) {
          await supabase
            .from("financial_transactions")
            .delete()
            .eq("id", createdFinancialId);
        }
        throw updateError;
      }

      const computedTotalCost =
        movementType === "entrada"
          ? launchFinancial && expenseValue > 0
            ? expenseValue
            : Number((parsedQty * unitCost).toFixed(2))
          : movementType === "saida"
            ? Number((parsedQty * (Number(item.unit_cost) || 0)).toFixed(2))
            : 0;

      const { error: movError } = await supabase
        .from("inventory_movements")
        .insert([
          {
            item_id: item.id,
            item_name: item.name,
            movement_type: movementType,
            quantity: parsedQty,
            previous_quantity: currentQty,
            new_quantity: previewNewQty,
            unit_cost:
              movementType === "entrada"
                ? unitCost
                : Number(item.unit_cost) || 0,
            total_cost: computedTotalCost,
            batch_number:
              movementType === "entrada"
                ? batchNumber.trim()
                : item.batch_number || "",
            expiration_date:
              movementType === "entrada"
                ? expirationDate || null
                : item.expiration_date || null,
            reason: reason.trim(),
            financial_transaction_id: createdFinancialId,
          },
        ]);

      if (movError) throw movError;

      toast.success("Movimentação registrada.");
      onOpenChange(false);
      onSaved();
    } catch (error: unknown) {
      console.error("Erro ao movimentar estoque:", error);
      toast.error(getErrorMessage(error, "Erro ao registrar movimentação."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Atual</span>
            <span className="font-semibold">
              {formatQuantity(currentQty, item.unit)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Movimento</Label>
              <Select
                value={movementType}
                onValueChange={(value) => {
                  const nextType = value as InventoryMovementType;
                  setMovementType(nextType);
                  setQuantity(nextType === "ajuste" ? String(currentQty) : "1");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (Compra)</SelectItem>
                  <SelectItem value="saida">Saída (Uso)</SelectItem>
                  <SelectItem value="ajuste">Ajuste Direto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mov-qty">
                {movementType === "ajuste" ? "Nova Quantidade" : "Quantidade"}
              </Label>
              <Input
                id="mov-qty"
                type="number"
                min={movementType === "ajuste" ? "0" : "0.01"}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Saldo após registro</span>
            <span className="font-bold text-primary">
              {formatQuantity(Math.max(0, previewNewQty), item.unit)}
            </span>
          </div>

          {movementType === "entrada" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Custo Unitário</Label>
                  <CurrencyInput
                    value={unitCost}
                    onChange={setUnitCost}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Lote</Label>
                  <Input
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Lote"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Validade</Label>
                  <Input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-3 bg-muted/40">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mov-launch-fin"
                    checked={launchFinancial}
                    onCheckedChange={(checked) =>
                      setLaunchFinancial(Boolean(checked))
                    }
                  />
                  <label
                    htmlFor="mov-launch-fin"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Lançar despesa no Financeiro
                  </label>
                </div>

                {launchFinancial && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <Label className="text-xs">Valor da Despesa</Label>
                      <CurrencyInput
                        value={expenseValue}
                        onChange={setExpenseValue}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data</Label>
                      <Input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center space-x-2">
                      <Checkbox
                        id="mov-fin-deductible"
                        checked={isDeductible}
                        onCheckedChange={(checked) =>
                          setIsDeductible(Boolean(checked))
                        }
                      />
                      <label
                        htmlFor="mov-fin-deductible"
                        className="text-xs font-medium cursor-pointer"
                      >
                        Despesa dedutível (Livro Caixa)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="mov-reason">Observação</Label>
            <Input
              id="mov-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Opcional"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Registrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
