import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, DollarSign, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrencyBRL,
  type InventoryMovement,
  type InventoryMovementType,
} from "@/lib/inventory";

interface InventoryMovementsTabProps {
  movements: InventoryMovement[];
}

const TYPE_META: Record<
  InventoryMovementType,
  { label: string; prefix: string; className: string }
> = {
  entrada: {
    label: "Entrada",
    prefix: "+",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  saida: {
    label: "Saída",
    prefix: "-",
    className: "bg-muted text-foreground border-border",
  },
  ajuste: {
    label: "Ajuste",
    prefix: "=",
    className: "bg-muted text-muted-foreground border-border",
  },
};

function formatDateTimeBR(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InventoryMovementsTab({
  movements,
}: InventoryMovementsTabProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movements.filter((mov) => {
      if (typeFilter !== "all" && mov.movement_type !== typeFilter) return false;
      if (!q) return true;
      return (
        mov.item_name.toLowerCase().includes(q) ||
        (mov.reason || "").toLowerCase().includes(q) ||
        (mov.batch_number || "").toLowerCase().includes(q)
      );
    });
  }, [movements, search, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar material, lote ou observação..."
            className="pl-9 bg-card"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
            <SelectItem value="ajuste">Ajustes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Nenhuma movimentação encontrada.
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((mov) => {
                  const meta = TYPE_META[mov.movement_type] || TYPE_META.ajuste;
                  return (
                    <TableRow key={mov.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTimeBR(mov.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{mov.item_name}</span>
                          {mov.batch_number && (
                            <span className="text-xs text-muted-foreground">
                              Lote {mov.batch_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={meta.className}>
                            {mov.movement_type === "entrada" && (
                              <ArrowUpRight className="w-3 h-3 mr-1" />
                            )}
                            {mov.movement_type === "saida" && (
                              <ArrowDownRight className="w-3 h-3 mr-1" />
                            )}
                            {mov.movement_type === "ajuste" && (
                              <RefreshCw className="w-3 h-3 mr-1" />
                            )}
                            {meta.label}
                          </Badge>
                          {mov.financial_transaction_id && (
                            <Badge variant="outline" className="text-[10px]">
                              <DollarSign className="w-3 h-3 mr-0.5" />
                              Financeiro
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {meta.prefix} {mov.quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {mov.previous_quantity} → {mov.new_quantity}
                      </TableCell>
                      <TableCell>
                        {mov.total_cost > 0
                          ? formatCurrencyBRL(mov.total_cost)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {mov.reason || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((mov) => {
              const meta = TYPE_META[mov.movement_type] || TYPE_META.ajuste;
              return (
                <div
                  key={mov.id}
                  className="bg-card rounded-xl border p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {mov.item_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeBR(mov.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className={meta.className}>
                      {meta.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                    <span>
                      Qtd: <strong>{meta.prefix} {mov.quantity}</strong> ({mov.previous_quantity} → {mov.new_quantity})
                    </span>
                    <div className="flex items-center gap-1.5">
                      {mov.total_cost > 0 && (
                        <span className="font-medium">
                          {formatCurrencyBRL(mov.total_cost)}
                        </span>
                      )}
                      {mov.financial_transaction_id && (
                        <Badge variant="outline" className="text-[10px]">
                          Financeiro
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(mov.reason || mov.batch_number) && (
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      {[
                        mov.batch_number ? `Lote ${mov.batch_number}` : "",
                        mov.reason,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
