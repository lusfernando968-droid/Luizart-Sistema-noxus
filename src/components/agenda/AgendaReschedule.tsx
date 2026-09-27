import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Search, MessageCircle, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function AgendaReschedule({ appointments, clients, onEdit, onRefresh }: any) {
  const [search, setSearch] = useState("");

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const pendingAppointments = appointments.filter((a: any) => a.status === 'Para Remarcar');
  const pendingSessions = appointments.filter((a: any) => a.status === 'Agendado' && a.date < todayStr);
  
  const filterBySearch = (list: any[]) => list.filter((a: any) => {
    if (!search) return true;
    const clientName = a.client_name?.toLowerCase() || "";
    return clientName.includes(search.toLowerCase());
  });

  const filteredToReschedule = filterBySearch(pendingAppointments);
  const filteredPending = filterBySearch(pendingSessions);

  const openWhatsApp = (phone: string, message: string) => {
    if (!phone || phone === "Não informado") return;
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Não definida";
      const parsed = parseISO(dateString);
      return format(parsed, "dd 'de' MMM, yyyy", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  const handleMarkAsRescheduled = async (id: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ status: 'Reagendado' }).eq('id', id);
      if (error) throw error;
      toast.success("Sessão marcada como Reagendada!");
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar sessão.");
    }
  };

  const renderTable = (list: any[], emptyMessage: string, isRescheduleList: boolean) => {
    if (list.length === 0) {
      return (
        <div className="text-xs text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl mt-4">
          {search ? "Nenhum cliente encontrado na busca." : emptyMessage}
        </div>
      );
    }

    return (
      <div className="rounded-xl border overflow-hidden mt-4">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Última Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((appt: any) => {
              const client = clients.find((c: any) => c.id === appt.client_id);
              const hasPhone = client?.phone && client.phone !== "Não informado";
              
              const wppMessageReschedule = `Olá ${appt.client_name || ''}! Vi que ficamos de remarcar a sua sessão de tatuagem. Já tem uma nova data em mente? Posso mandar os horários disponíveis?`;
              const wppMessagePending = `Olá ${appt.client_name || ''}! Vi que a sua sessão do dia ${formatDate(appt.date)} ficou pendente no sistema. Deu tudo certo?`;

              return (
                <TableRow key={appt.id}>
                  <TableCell className="font-bold text-sm">{appt.client_name || "Cliente"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(appt.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${isRescheduleList ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}`}>
                      {isRescheduleList ? 'Para Remarcar' : 'Sessão Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {hasPhone && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border-transparent px-2"
                          onClick={() => openWhatsApp(client.phone, isRescheduleList ? wppMessageReschedule : wppMessagePending)}
                          title="Chamar Cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      
                      {isRescheduleList && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          title="Sessão Reagendada"
                          onClick={() => handleMarkAsRescheduled(appt.id)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Reagendado
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[10px] px-2"
                        title={isRescheduleList ? "Novo Horário" : "Editar"}
                        onClick={() => {
                          onEdit(appt, {
                            client_id: appt.client_id || "",
                            journey_id: appt.journey_id || "",
                            date: appt.date || new Date().toISOString().split("T")[0],
                            startTime: appt.startTime || "09:00",
                            endTime: appt.endTime || "10:00",
                            status: "Agendado", // Automatically switch to "Agendado" to encourage picking a time
                            value: appt.value || 0,
                            deposit: appt.deposit || 0,
                            deposit_date: appt.deposit_date || new Date().toISOString().split("T")[0],
                            deposit_link: appt.deposit_link || ""
                          });
                        }}
                      >
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {isRescheduleList ? "Novo Horário" : "Editar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Lista de Remarcações e Pendências</h2>
          <p className="text-xs text-muted-foreground">Controle de clientes aguardando remarcação e sessões antigas pendentes.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar cliente..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm bg-card"
          />
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-2">
            <AlertCircle className="w-4 h-4 text-orange-500" /> Para Remarcar
          </h3>
          {renderTable(filteredToReschedule, "Nenhum cliente aguardando remarcação no momento. Ótimo!", true)}
        </div>

        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-2">
            <Clock className="w-4 h-4 text-yellow-500" /> Sessões Pendentes (Passadas)
          </h3>
          {renderTable(filteredPending, "Nenhuma sessão pendente. Tudo em dia!", false)}
        </div>
      </div>
    </div>
  );
}
