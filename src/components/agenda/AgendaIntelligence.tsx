import { useMemo } from "react";
import { format, subDays, subYears, addDays, subMonths } from "date-fns";
import { BrainCircuit, Clock, CalendarHeart, History, CalendarClock, MessageCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AgendaIntelligence({ appointments, clients }: any) {
  const today = new Date();
  
  const categories = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
    const sevenDaysAgoStr = format(subDays(today, 7), 'yyyy-MM-dd');
    const twoMonthsAgoStr = format(subMonths(today, 2), 'yyyy-MM-dd');
    const oneYearAgoStr = format(subYears(today, 1), 'yyyy-MM-dd');

    const todayList = appointments.filter((a: any) => a.date === todayStr);
    const tomorrowList = appointments.filter((a: any) => a.date === tomorrowStr);
    const sevenDaysList = appointments.filter((a: any) => a.date === sevenDaysAgoStr && a.status === 'Concluído');
    const twoMonthsList = appointments.filter((a: any) => a.date === twoMonthsAgoStr && a.status === 'Concluído');
    const oneYearList = appointments.filter((a: any) => a.date === oneYearAgoStr && a.status === 'Concluído');

    return {
      todayList,
      tomorrowList,
      sevenDaysList,
      twoMonthsList,
      oneYearList
    };
  }, [appointments]);

  const openWhatsApp = (phone: string, message: string) => {
    if (!phone || phone === "Não informado") return;
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const renderList = (list: any[], emptyMessage: string, context: 'today' | 'tomorrow' | '7days' | '2months' | '1year') => {
    if (list.length === 0) return <div className="text-xs text-center p-6 text-muted-foreground border-2 border-dashed rounded-xl">{emptyMessage}</div>;
    
    return (
      <div className="space-y-3">
        {list.map(appt => {
          const client = clients.find((c: any) => c.id === appt.client_id);
          const hasPhone = client?.phone && client.phone !== "Não informado";
          
          let wppMessage = "";
          if (context === 'tomorrow') wppMessage = `Olá ${appt.client_name || ''}! Passando para lembrar da nossa sessão de tatuagem amanhã às ${appt.startTime}. Até lá!`;
          if (context === '7days') wppMessage = `Fala ${appt.client_name || ''}! Como está a cicatrização da tattoo que fizemos há uma semana? Tudo certinho?`;
          if (context === '2months') wppMessage = `Fala ${appt.client_name || ''}! Tudo bem? Já faz 2 meses da nossa última tattoo, ela já deve estar 100% cicatrizada! Bora pensar no próximo projeto?`;
          if (context === '1year') wppMessage = `Oie ${appt.client_name || ''}! Sabia que sua tattoo está fazendo 1 ano hoje? Parabéns! Já vamos planejar a próxima? Hahaha!`;

          return (
            <div key={appt.id} className="bg-card border shadow-sm hover:shadow-md transition-all rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
               <div>
                 <div className="flex items-center gap-2">
                   <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">{appt.client_name || "Cliente"}</h4>
                   <Badge variant="outline" className="text-[10px] bg-background">{appt.startTime}</Badge>
                 </div>
                 {client?.phone && <p className="text-[10px] text-muted-foreground mt-0.5">{client.phone}</p>}
               </div>
               
               <div className="flex items-center gap-2">
                 <Badge variant={appt.status === 'Concluído' ? 'default' : appt.status === 'Cancelado' ? 'destructive' : 'secondary'} className="text-[10px]">
                   {appt.status}
                 </Badge>
                 
                 {hasPhone && context !== 'today' && (
                   <button 
                     onClick={() => openWhatsApp(client.phone, wppMessage)}
                     className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white p-1.5 rounded-full transition-colors flex items-center gap-1 px-2"
                     title="Enviar Mensagem CRM"
                   >
                     <MessageCircle className="w-3 h-3" />
                     <span className="text-[10px] font-bold hidden sm:inline">Mensagem</span>
                   </button>
                 )}
               </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Assistente de Relacionamento (CRM)</h2>
        <p className="text-xs text-muted-foreground">Insights automáticos baseados na sua agenda para melhorar o atendimento e fidelizar clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <div className="bg-card rounded-xl border p-4 shadow-sm space-y-4">
           <div>
             <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
               <CalendarClock className="w-4 h-4" /> Agendamentos de Amanhã
             </h3>
             <p className="text-xs text-muted-foreground mt-1">
               Lembre os clientes de amanhã para evitar faltas na agenda.
             </p>
           </div>
           {renderList(categories.tomorrowList, "Você não tem nenhum agendamento para amanhã.", 'tomorrow')}
         </div>

         <div className="bg-card rounded-xl border p-4 shadow-sm space-y-4">
           <div>
             <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
               <CalendarHeart className="w-4 h-4" /> Pós-Tatuagem (Há 7 dias)
             </h3>
             <p className="text-xs text-muted-foreground mt-1">
               Acompanhe a cicatrização de quem tatuou semana passada.
             </p>
           </div>
           {renderList(categories.sevenDaysList, "Nenhuma tatuagem concluída há exatamente 7 dias.", '7days')}
         </div>

         <div className="bg-card rounded-xl border p-4 shadow-sm space-y-4">
           <div>
             <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
               <RefreshCw className="w-4 h-4" /> Retorno Pós-Tattoo (Há 2 meses)
             </h3>
             <p className="text-xs text-muted-foreground mt-1">
               A tatuagem já deve estar cicatrizada. Ótimo momento para chamar para um novo projeto!
             </p>
           </div>
           {renderList(categories.twoMonthsList, "Nenhuma tatuagem fez 2 meses hoje.", '2months')}
         </div>

         <div className="bg-card rounded-xl border p-4 shadow-sm space-y-4">
           <div>
             <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
               <History className="w-4 h-4" /> Aniversário da Tattoo (1 ano)
             </h3>
             <p className="text-xs text-muted-foreground mt-1">
               Clientes que tatuaram com você exatamente hoje há 1 ano. Chame para um novo projeto!
             </p>
           </div>
           {renderList(categories.oneYearList, "Nenhuma tatuagem fez 1 ano hoje.", '1year')}
         </div>
         
         <div className="bg-card rounded-xl border p-4 shadow-sm space-y-4 lg:col-span-2">
           <div>
             <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
               <Clock className="w-4 h-4" /> Agendamentos de Hoje
             </h3>
             <p className="text-xs text-muted-foreground mt-1">
               Acompanhamento rápido do dia atual.
             </p>
           </div>
           {renderList(categories.todayList, "Agenda livre hoje.", 'today')}
         </div>
      </div>
    </div>
  );
}
