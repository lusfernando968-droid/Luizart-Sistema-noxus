import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, CalendarPlus, Clock, Users, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

export interface FreedSlotInfo {
  appointmentId?: string;
  previousClientName?: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  value?: number;
}

interface WaitlistReallocateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freedSlot: FreedSlotInfo | null;
  clients?: any[];
  onReallocated?: () => void;
}

export function WaitlistReallocateModal({
  open,
  onOpenChange,
  freedSlot,
  clients: externalClients,
  onReallocated,
}: WaitlistReallocateModalProps) {
  const [internalClients, setInternalClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingClientId, setBookingClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"waitlist" | "all">("waitlist");

  useEffect(() => {
    if (open) {
      setSearch("");
      setViewMode("waitlist");
      fetchLatestClients();
    }
  }, [open]);

  const fetchLatestClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("waitlist_added_at", { ascending: false, nullsFirst: false });
      if (!error && data) {
        setInternalClients(data);
      } else if (externalClients) {
        setInternalClients(externalClients);
      }
    } catch (e) {
      if (externalClients) setInternalClients(externalClients);
    } finally {
      setLoading(false);
    }
  };

  const allClients = internalClients.length > 0 ? internalClients : (externalClients || []);
  const waitlistClients = useMemo(
    () => allClients.filter((c) => Boolean(c.is_waitlist)),
    [allClients]
  );

  // Se a lista de espera estiver vazia ao abrir, mostra todos os clientes automaticamente
  useEffect(() => {
    if (open && !loading && allClients.length > 0 && waitlistClients.length === 0) {
      setViewMode("all");
    }
  }, [open, loading, allClients.length, waitlistClients.length]);

  const displayedClients = useMemo(() => {
    const baseList = viewMode === "waitlist" ? waitlistClients : allClients;
    if (!search.trim()) return baseList;
    const q = search.toLowerCase();
    return baseList.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.waitlist_notes || "").toLowerCase().includes(q)
    );
  }, [viewMode, waitlistClients, allClients, search]);

  const formattedDate = useMemo(() => {
    if (!freedSlot?.date) return "Hoje";
    if (freedSlot.date.includes("-")) {
      return freedSlot.date.split("-").reverse().join("/");
    }
    return freedSlot.date;
  }, [freedSlot?.date]);

  const handleCallWhatsApp = (client: any) => {
    const rawPhone = (client.phone || "").replace(/\D/g, "");
    if (!rawPhone || rawPhone.length < 10) {
      toast.error("Cliente sem número de WhatsApp válido.");
      return;
    }
    const phoneWithCountry = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
    const timeText = freedSlot?.startTime ? ` às ${freedSlot.startTime}` : "";
    const msg = `Fala ${client.name}, tudo bem? Acabou de abrir uma vaga na agenda para o dia ${formattedDate}${timeText}. Consegue vir nesse horário?`;
    openWhatsApp(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`);
  };

  const handleBookSlot = async (client: any) => {
    if (!freedSlot) return;
    try {
      setBookingClientId(client.id);
      const userStr = localStorage.getItem("noxus_user");
      const loggedUser = userStr ? JSON.parse(userStr) : null;

      const payload: any = {
        client_id: client.id,
        date: freedSlot.date || new Date().toISOString().split("T")[0],
        start_time: freedSlot.startTime || "09:00",
        end_time: freedSlot.endTime || "11:00",
        status: "Agendado",
        type: "Tatuagem",
        notes: client.waitlist_notes
          ? `Encaixe Lista de Espera: ${client.waitlist_notes}`
          : `Horário realocado (${freedSlot.previousClientName || "Vaga liberada"})`,
        value: freedSlot.value || 0,
        deposit: 0,
        user_id: loggedUser?.id || null,
      };

      const { error: apptError } = await supabase.from("appointments").insert([payload]);
      if (apptError) throw apptError;

      // Remove o cliente da lista de espera após ser encaixado na vaga
      if (client.is_waitlist) {
        await supabase
          .from("clientes")
          .update({ is_waitlist: false })
          .eq("id", client.id);
      }

      toast.success(`Horário realocado para ${client.name}!`);
      onOpenChange(false);
      if (onReallocated) onReallocated();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao realocar horário.");
    } finally {
      setBookingClientId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Realocar Horário para Outro Cliente?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
          {/* Resumo da Vaga Liberada */}
          {freedSlot && (
            <div className="bg-muted p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-foreground block text-sm">
                  Vaga: {formattedDate} • {freedSlot.startTime || "09:00"}
                  {freedSlot.endTime ? ` às ${freedSlot.endTime}` : ""}
                </span>
                {freedSlot.previousClientName && (
                  <span className="text-muted-foreground block">
                    Liberado por: {freedSlot.previousClientName}
                    {freedSlot.reason ? ` (${freedSlot.reason})` : ""}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-primary/10 text-primary border border-primary/20 self-start sm:self-center shrink-0">
                Horário Disponível
              </span>
            </div>
          )}

          {/* Alternador Lista de Espera vs Todos os Clientes */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("waitlist")}
              className={`h-9 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === "waitlist"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Lista de Espera ({waitlistClients.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`h-9 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === "all"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Todos os Clientes ({allClients.length})
            </button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar cliente por nome, telefone ou observação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 text-sm"
            />
          </div>

          {/* Lista de Clientes */}
          <div className="flex-1 overflow-y-auto divide-y border rounded-xl bg-card min-h-[220px] max-h-[320px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Carregando clientes...
              </div>
            ) : displayedClients.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  {viewMode === "waitlist"
                    ? "Nenhum cliente na Lista de Espera."
                    : "Nenhum cliente encontrado."}
                </p>
                {viewMode === "waitlist" && allClients.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setViewMode("all")}
                  >
                    Ver Todos os Clientes
                  </Button>
                )}
              </div>
            ) : (
              displayedClients.map((client) => (
                <div
                  key={client.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {client.avatar_url ? (
                        <img
                          src={client.avatar_url}
                          alt={client.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        (client.name || "C").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-foreground truncate">
                          {client.name}
                        </span>
                        {client.is_waitlist && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Espera
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground block">
                        {client.phone || "Sem telefone"}
                      </span>
                      {client.waitlist_notes && (
                        <span className="text-[11px] text-foreground/80 bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                          {client.waitlist_notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-2.5 text-xs gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border-transparent font-semibold"
                      onClick={() => handleCallWhatsApp(client)}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 px-3 text-xs gap-1.5 font-semibold"
                      disabled={bookingClientId === client.id}
                      onClick={() => handleBookSlot(client)}
                    >
                      {bookingClientId === client.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <CalendarPlus className="w-3.5 h-3.5" />
                      )}
                      Realocar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Agora Não (Deixar Vago)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
