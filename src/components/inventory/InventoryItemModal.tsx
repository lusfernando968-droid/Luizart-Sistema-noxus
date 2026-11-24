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
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  getErrorMessage,
  type InventoryItem,
} from "@/lib/inventory";
import { toast } from "sonner";

interface InventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: InventoryItem | null;
  onSaved: () => void;
}

const DEFAULT_FORM = {
  name: "",
  category: INVENTORY_CATEGORIES[0] as string,
  unit: "un",
  quantity: "0",
  min_quantity: "5",
  unit_cost: 0,
  batch_number: "",
  expiration_date: "",
  supplier: "",
  notes: "",
};

export function InventoryItemModal({
  open,
  onOpenChange,
  editingItem,
  onSaved,
}: InventoryItemModalProps) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [launchFinancial, setLaunchFinancial] = useState(false);
  const [expenseValue, setExpenseValue] = useState(0);
  const [expenseDate, setExpenseDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [isDeductible, setIsDeductible] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setForm({
        name: editingItem.name,
        category: editingItem.category || INVENTORY_CATEGORIES[0],
        unit: editingItem.unit || "un",
        quantity: String(editingItem.quantity ?? 0),
        min_quantity: String(editingItem.min_quantity ?? 5),
        unit_cost: Number(editingItem.unit_cost) || 0,
        batch_number: editingItem.batch_number || "",
        expiration_date: editingItem.expiration_date
          ? editingItem.expiration_date.slice(0, 10)
          : "",
        supplier: editingItem.supplier || "",
        notes: editingItem.notes || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setLaunchFinancial(false);
    setExpenseValue(0);
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setIsDeductible(true);
  }, [open, editingItem]);

  useEffect(() => {
    if (!editingItem) {
      const qty = Math.max(0, Number(form.quantity) || 0);
      setExpenseValue(Number((qty * form.unit_cost).toFixed(2)));
    }
  }, [form.quantity, form.unit_cost, editingItem]);

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error("Informe o nome do material.");
      return;
    }

    const quantity = Number(form.quantity);
    const minQuantity = Number(form.min_quantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error("Quantidade inválida.");
      return;
    }
    if (isNaN(minQuantity) || minQuantity < 0) {
      toast.error("Estoque mínimo inválido.");
      return;
    }

    setSaving(true);
    let createdFinancialId: string | null = null;

    try {
      const payload = {
        name: trimmedName,
        category: form.category,
        unit: form.unit,
        quantity,
        min_quantity: minQuantity,
        unit_cost: Number(form.unit_cost) || 0,
        batch_number: form.batch_number.trim(),
        expiration_date: form.expiration_date || null,
        supplier: form.supplier.trim(),
        notes: form.notes.trim(),
        updated_at: new Date().toISOString(),
      };

      if (editingItem) {
        const { error } = await supabase
          .from("inventory_items")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;

        if (quantity !== Number(editingItem.quantity)) {
          await supabase.from("inventory_movements").insert([
            {
              item_id: editingItem.id,
              item_name: trimmedName,
              movement_type: "ajuste",
              quantity,
              previous_quantity: Number(editingItem.quantity),
              new_quantity: quantity,
              unit_cost: payload.unit_cost,
              total_cost: 0,
              batch_number: payload.batch_number,
              expiration_date: payload.expiration_date,
              reason: "Ajuste direto no cadastro",
            },
          ]);
        }

        toast.success("Material atualizado.");
      } else {
        if (launchFinancial && quantity > 0 && expenseValue > 0) {
          const { data: finData, error: finError } = await supabase
            .from("financial_transactions")
            .insert([
              {
                description: `Compra Estoque: ${trimmedName} (${quantity} ${form.unit})`,
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

        const { data: itemData, error } = await supabase
          .from("inventory_items")
          .insert([payload])
          .select("id")
          .single();

        if (error) {
          if (createdFinancialId) {
            await supabase
              .from("financial_transactions")
              .delete()
              .eq("id", createdFinancialId);
          }
          throw error;
        }

        if (quantity > 0 && itemData?.id) {
          await supabase.from("inventory_movements").insert([
            {
              item_id: itemData.id,
              item_name: trimmedName,
              movement_type: "entrada",
              quantity,
              previous_quantity: 0,
              new_quantity: quantity,
              unit_cost: payload.unit_cost,
              total_cost:
                launchFinancial && expenseValue > 0
                  ? expenseValue
                  : Number((quantity * payload.unit_cost).toFixed(2)),
              batch_number: payload.batch_number,
              expiration_date: payload.expiration_date,
              reason: "Saldo inicial",
              financial_transaction_id: createdFinancialId,
            },
          ]);
        }

        toast.success("Material cadastrado.");
      }

      onOpenChange(false);
      onSaved();
    } catch (error: unknown) {
      console.error("Erro ao salvar material:", error);
      toast.error(getErrorMessage(error, "Erro ao salvar material."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Editar Material" : "Novo Material"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="inv-name">Nome</Label>
            <Input
              id="inv-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Cartucho RL 05"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Unidade</Label>
              <Select
                value={form.unit}
                onValueChange={(value) => setForm({ ...form, unit: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="inv-qty">Quantidade</Label>
              <Input
                id="inv-qty"
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="inv-min">Estoque Mínimo</Label>
              <Input
                id="inv-min"
                type="number"
                min="0"
                step="any"
                value={form.min_quantity}
                onChange={(e) =>
                  setForm({ ...form, min_quantity: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="inv-cost">Custo Unitário</Label>
              <CurrencyInput
                id="inv-cost"
                value={form.unit_cost}
                onChange={(value) => setForm({ ...form, unit_cost: value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="inv-batch">Lote</Label>
              <Input
                id="inv-batch"
                value={form.batch_number}
                onChange={(e) =>
                  setForm({ ...form, batch_number: e.target.value })
                }
                placeholder="Ex: L2026-09"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="inv-exp">Validade</Label>
              <Input
                id="inv-exp"
                type="date"
                value={form.expiration_date}
                onChange={(e) =>
                  setForm({ ...form, expiration_date: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="inv-supplier">Fornecedor</Label>
              <Input
                id="inv-supplier"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="inv-notes">Observações</Label>
              <Input
                id="inv-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>
          </div>

          {!editingItem && Number(form.quantity) > 0 && (
            <div className="rounded-lg border p-3 space-y-3 bg-muted/40">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inv-init-fin"
                  checked={launchFinancial}
                  onCheckedChange={(checked) =>
                    setLaunchFinancial(Boolean(checked))
                  }
                />
                <label
                  htmlFor="inv-init-fin"
                  className="text-sm font-medium cursor-pointer"
                >
                  Lançar despesa no Financeiro
                </label>
              </div>

              {launchFinancial && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-xs">Valor Total</Label>
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
                      id="inv-init-deductible"
                      checked={isDeductible}
                      onCheckedChange={(checked) =>
                        setIsDeductible(Boolean(checked))
                      }
                    />
                    <label
                      htmlFor="inv-init-deductible"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Despesa dedutível (Livro Caixa)
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
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
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
