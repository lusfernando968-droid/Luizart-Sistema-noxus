import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Search, MessageCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AgendaReschedule({ appointments, clients, onEdit }: any) {
  const [search, setSearch] = useState("");

  const pendingAppointments = appointments.filter((a: any) => a.status === 'Para Remarcar');
  
  const filtered = pendingAppointments.filter((a: any) => {
    if (!search) return true;
    const clientName = a.client_name?.toLowerCase() || "";
    return clientName.includes(search.toLowerCase());
  });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Lista de Remarcações</h2>
          <p className="text-xs text-muted-foreground">Controle de clientes que cancelaram e precisam de um novo horário.</p>
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

      <div className="bg-card rounded-xl border p-4 shadow-sm min-h-[400px]">
        {filtered.length === 0 ? (
           <div className="text-xs text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl mt-4">
             {search ? "Nenhum cliente encontrado na busca." : "Nenhum cliente aguardando remarcação no momento. Ótimo!"}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {filtered.map((appt: any) => {
              const client = clients.find((c: any) => c.id === appt.client_id);
              const hasPhone = client?.phone && client.phone !== "Não informado";
              
              const wppMessage = `Olá ${appt.client_name || ''}! Vi que ficamos de remarcar a sua sessão de tatuagem. Já tem uma nova data em mente? Posso mandar os horários disponíveis?`;
              
              return (
                <div key={appt.id} className="border rounded-xl p-4 flex flex-col gap-4 hover:border-orange-500/50 hover:shadow-md transition-all group bg-background/50">
                   <div>
                     <div className="flex items-center justify-between mb-1">
                       <h4 className="font-bold text-sm text-foreground">{appt.client_name || "Cliente"}</h4>
                       <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-600 border-orange-500/20">Para Remarcar</Badge>
                     </div>
                     <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                       <Calendar className="w-3.5 h-3.5" />
                       Última data: {formatDate(appt.date)}
                     </p>
                   </div>
                   
                   <div className="flex gap-2 mt-auto pt-2 border-t">
                     {hasPhone && (
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="flex-1 h-8 text-[10px] bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border-transparent"
                         onClick={() => openWhatsApp(client.phone, wppMessage)}
                       >
                         <MessageCircle className="w-3.5 h-3.5 mr-1" />
                         <span className="hidden sm:inline">Chamar Cliente</span>
                         <span className="sm:hidden">Chamar</span>
                       </Button>
                     )}
                     
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="flex-1 h-8 text-[10px]"
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
                       Novo Horário
                     </Button>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
