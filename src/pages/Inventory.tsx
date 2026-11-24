import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  DollarSign,
  History,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryItemModal } from "@/components/inventory/InventoryItemModal";
import { InventoryMovementModal } from "@/components/inventory/InventoryMovementModal";
import { InventoryMovementsTab } from "@/components/inventory/InventoryMovementsTab";
import {
  INVENTORY_CATEGORIES,
  formatCurrencyBRL,
  formatIsoDateBR,
  formatQuantity,
  getErrorMessage,
  getExpirationStatus,
  isLowStock,
  type InventoryItem,
  type InventoryMovement,
  type InventoryMovementType,
} from "@/lib/inventory";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Inventory() {
  const userStr = localStorage.getItem("noxus_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAssistant =
    user?.role === "ASSISTANT" || user?.name?.includes("Gabriel");

  const [activeTab, setActiveTab] = useState("itens");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementInitialType, setMovementInitialType] =
    useState<InventoryMovementType>("entrada");

  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, movsRes] = await Promise.all([
        supabase
          .from("inventory_items")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("inventory_movements")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (movsRes.error) throw movsRes.error;

      setItems((itemsRes.data || []) as InventoryItem[]);
      setMovements((movsRes.data || []) as InventoryMovement[]);
    } catch (error: unknown) {
      console.error("Erro ao carregar estoque:", error);
      toast.error(getErrorMessage(error, "Erro ao carregar estoque."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAssistant) {
      fetchInventoryData();
    }
  }, [fetchInventoryData, isAssistant]);

  const metrics = useMemo(() => {
    let lowCount = 0;
    let expiringCount = 0;
    let totalValue = 0;

    for (const item of items) {
      if (isLowStock(item)) lowCount += 1;
      const exp = getExpirationStatus(item.expiration_date);
      if (exp.status === "expired" || exp.status === "expiring") {
        expiringCount += 1;
      }
      totalValue += (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0);
    }

    return {
      totalItems: items.length,
      lowCount,
      expiringCount,
      totalValue,
    };
  }, [items]);

  const attentionItems = useMemo(() => {
    return items.filter((item) => {
      const exp = getExpirationStatus(item.expiration_date);
      return (
        isLowStock(item) ||
        exp.status === "expired" ||
        exp.status === "expiring"
      );
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      const low = isLowStock(item);
      const exp = getExpirationStatus(item.expiration_date);
      const expAlert = exp.status === "expired" || exp.status === "expiring";

      if (statusFilter === "low" && !low) return false;
      if (statusFilter === "expiring" && !expAlert) return false;
      if (statusFilter === "ok" && (low || expAlert)) return false;

      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.batch_number || "").toLowerCase().includes(q) ||
        (item.supplier || "").toLowerCase().includes(q)
      );
    });
  }, [items, search, categoryFilter, statusFilter]);

  if (isAssistant) {
    return <Navigate to="/agenda" replace />;
  }

  const openCreateModal = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const openMovementModal = (
    item: InventoryItem,
    type: InventoryMovementType
  ) => {
    setMovementItem(item);
    setMovementInitialType(type);
    setMovementModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Material removido.");
      setDeleteTarget(null);
      fetchInventoryData();
    } catch (error: unknown) {
      console.error("Erro ao remover material:", error);
      toast.error(getErrorMessage(error, "Erro ao remover material."));
    } finally {
      setDeleting(false);
    }
  };

  const renderStatusBadges = (item: InventoryItem) => {
    const low = isLowStock(item);
    const exp = getExpirationStatus(item.expiration_date);
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {Number(item.quantity) === 0 ? (
          <Badge variant="destructive" className="text-[11px]">
            Zerado
          </Badge>
        ) : low ? (
          <Badge
            variant="outline"
            className="text-[11px] border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          >
            Baixo
          </Badge>
        ) : null}

        {exp.status === "expired" && (
          <Badge variant="destructive" className="text-[11px]">
            Vencido
          </Badge>
        )}
        {exp.status === "expiring" && (
          <Badge
            variant="outline"
            className="text-[11px] border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          >
            Vence em {exp.daysLeft}d
          </Badge>
        )}
      </div>
    );
  };

  const renderItemsView = (list: InventoryItem[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="bg-card rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Carregando estoque...
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="bg-card rounded-xl border p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <>
        {/* Desktop Table */}
        <div className="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Lote / Validade</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Custo Unit.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => {
                const low = isLowStock(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {item.name}
                          </span>
                          {renderStatusBadges(item)}
                        </div>
                        {item.supplier && (
                          <p className="text-xs text-muted-foreground">
                            {item.supplier}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.category}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="space-y-0.5">
                        <div>
                          {item.batch_number
                            ? `Lote ${item.batch_number}`
                            : "Sem lote"}
                        </div>
                        <div>{formatIsoDateBR(item.expiration_date)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          low
                            ? "font-bold text-destructive"
                            : "font-semibold text-foreground"
                        }
                      >
                        {formatQuantity(item.quantity, item.unit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatQuantity(item.min_quantity, item.unit)}
                    </TableCell>
                    <TableCell>
                      {item.unit_cost > 0
                        ? formatCurrencyBRL(item.unit_cost)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMovementModal(item, "saida")}
                          disabled={Number(item.quantity) <= 0}
                          title="Registrar saída"
                          className="h-8 px-2.5 gap-1"
                        >
                          <Minus className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">Saída</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMovementModal(item, "entrada")}
                          title="Registrar entrada"
                          className="h-8 px-2.5 gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">Entrada</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(item)}
                          title="Editar"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(item)}
                          title="Excluir"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {list.map((item) => {
            const low = isLowStock(item);
            return (
              <div
                key={item.id}
                className="bg-card rounded-xl border p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.category}
                      {item.supplier ? ` • ${item.supplier}` : ""}
                    </p>
                  </div>
                  {renderStatusBadges(item)}
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Atual</span>
                    <span
                      className={
                        low ? "font-bold text-destructive" : "font-semibold"
                      }
                    >
                      {formatQuantity(item.quantity, item.unit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Mínimo</span>
                    <span className="font-medium">
                      {formatQuantity(item.min_quantity, item.unit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Custo</span>
                    <span className="font-medium">
                      {item.unit_cost > 0
                        ? formatCurrencyBRL(item.unit_cost)
                        : "—"}
                    </span>
                  </div>
                </div>

                {(item.batch_number || item.expiration_date) && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {item.batch_number ? `Lote ${item.batch_number}` : "—"}
                    </span>
                    <span>Val: {formatIsoDateBR(item.expiration_date)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openMovementModal(item, "saida")}
                    disabled={Number(item.quantity) <= 0}
                    className="flex-1 h-8 gap-1"
                  >
                    <Minus className="h-3.5 w-3.5" />
                    Saída
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openMovementModal(item, "entrada")}
                    className="flex-1 h-8 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Entrada
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(item)}
                    className="h-8 w-8 shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(item)}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Padrão */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Estoque</h1>
          <p className="page-subtitle">Materiais, validade e movimentações</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo Material
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <Package className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Itens
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {metrics.totalItems}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <AlertTriangle
                className={
                  metrics.lowCount > 0
                    ? "h-5 w-5 text-amber-600"
                    : "h-5 w-5 text-foreground"
                }
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Estoque Baixo
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {metrics.lowCount}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <CalendarClock
                className={
                  metrics.expiringCount > 0
                    ? "h-5 w-5 text-destructive"
                    : "h-5 w-5 text-foreground"
                }
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Validade
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {metrics.expiringCount}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <DollarSign className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Valor Total
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                {formatCurrencyBRL(metrics.totalValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas abaixo do cabeçalho */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger
            value="itens"
            className="rounded-sm flex items-center justify-center gap-2 text-xs font-semibold px-3 sm:px-4"
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Itens</span>
          </TabsTrigger>
          <TabsTrigger
            value="reposicao"
            className="rounded-sm flex items-center justify-center gap-2 text-xs font-semibold px-3 sm:px-4"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Reposição</span>
            {attentionItems.length > 0 && (
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[10px] leading-none"
              >
                {attentionItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="movimentacoes"
            className="rounded-sm flex items-center justify-center gap-2 text-xs font-semibold px-3 sm:px-4"
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itens" className="m-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar material, lote ou fornecedor..."
                className="pl-9 bg-card"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-52 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {INVENTORY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
                <SelectItem value="expiring">Vencido / Vencendo</SelectItem>
                <SelectItem value="ok">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderItemsView(filteredItems, "Nenhum material encontrado.")}
        </TabsContent>

        <TabsContent value="reposicao" className="m-0 space-y-4">
          {renderItemsView(
            attentionItems,
            "Nenhum material abaixo do mínimo ou próximo do vencimento."
          )}
        </TabsContent>

        <TabsContent value="movimentacoes" className="m-0">
          <InventoryMovementsTab movements={movements} />
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <InventoryItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        editingItem={editingItem}
        onSaved={fetchInventoryData}
      />

      <InventoryMovementModal
        open={movementModalOpen}
        onOpenChange={setMovementModalOpen}
        item={movementItem}
        initialType={movementInitialType}
        onSaved={fetchInventoryData}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material</AlertDialogTitle>
            <AlertDialogDescription>
              Remover "{deleteTarget?.name}" e todo o histórico de movimentações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
