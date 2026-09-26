import { useMemo } from "react";
import { format, subDays, subYears, addDays } from "date-fns";
import { BrainCircuit, Clock, CalendarHeart, History, CalendarClock, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AgendaIntelligence({ appointments, clients }: any) {
  const today = new Date();
  
  const categories = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
    const sevenDaysAgoStr = format(subDays(today, 7), 'yyyy-MM-dd');
    const oneYearAgoStr = format(subYears(today, 1), 'yyyy-MM-dd');

    const todayList = appointments.filter((a: any) => a.date === todayStr);
    const tomorrowList = appointments.filter((a: any) => a.date === tomorrowStr);
    const sevenDaysList = appointments.filter((a: any) => a.date === sevenDaysAgoStr && a.status === 'Concluído');
    const oneYearList = appointments.filter((a: any) => a.date === oneYearAgoStr && a.status === 'Concluído');

    return {
      todayList,
      tomorrowList,
      sevenDaysList,
      oneYearList
    };
  }, [appointments]);

  const openWhatsApp = (phone: string, message: string) => {
    if (!phone || phone === "Não informado") return;
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const renderList = (list: any[], emptyMessage: string, context: 'today' | 'tomorrow' | '7days' | '1year') => {
    if (list.length === 0) return <p className="text-sm text-muted-foreground italic p-2 border border-dashed rounded-lg bg-muted/20">{emptyMessage}</p>;
    
    return (
      <div className="space-y-3">
        {list.map(appt => {
          const client = clients.find((c: any) => c.id === appt.client_id);
          const hasPhone = client?.phone && client.phone !== "Não informado";
          
          let wppMessage = "";
          if (context === 'tomorrow') wppMessage = `Olá ${appt.client_name || ''}! Passando para lembrar da nossa sessão de tatuagem amanhã às ${appt.startTime}. Até lá!`;
          if (context === '7days') wppMessage = `Fala ${appt.client_name || ''}! Como está a cicatrização da tattoo que fizemos há uma semana? Tudo certinho?`;
          if (context === '1year') wppMessage = `Oie ${appt.client_name || ''}! Sabia que sua tattoo está fazendo 1 ano hoje? Parabéns! Já vamos planejar a próxima? Hahaha!`;

          return (
            <div key={appt.id} className="bg-card border p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all group">
               <div>
                 <div className="flex items-center gap-2">
                   <h4 className="font-bold text-sm text-foreground">{appt.client_name || "Cliente"}</h4>
                   <Badge variant="outline" className="text-[10px]">{appt.startTime}</Badge>
                 </div>
                 {client?.phone && <p className="text-xs text-muted-foreground mt-0.5">{client.phone}</p>}
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
                     <MessageCircle className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold">Cobrar/Lembrar</span>
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
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Assistente de Relacionamento (CRM)</h2>
          <p className="text-xs text-muted-foreground">Insights automáticos baseados na sua agenda para melhorar o atendimento e fidelizar clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <Card className="border-t-4 border-t-amber-500 shadow-sm">
           <CardHeader className="pb-3 bg-muted/10">
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <CalendarClock className="w-4 h-4 text-amber-500" /> Agendamentos de Amanhã
             </CardTitle>
             <CardDescription className="text-xs">
               Lembre os clientes de amanhã para evitar faltas na agenda.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-4">
             {renderList(categories.tomorrowList, "Você não tem nenhum agendamento para amanhã.", 'tomorrow')}
           </CardContent>
         </Card>

         <Card className="border-t-4 border-t-purple-500 shadow-sm">
           <CardHeader className="pb-3 bg-muted/10">
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <CalendarHeart className="w-4 h-4 text-purple-500" /> Pós-Tatuagem (Há 7 dias)
             </CardTitle>
             <CardDescription className="text-xs">
               Acompanhe a cicatrização de quem tatuou semana passada. Mostra muito profissionalismo!
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-4">
             {renderList(categories.sevenDaysList, "Nenhuma tatuagem concluída há exatamente 7 dias.", '7days')}
           </CardContent>
         </Card>

         <Card className="border-t-4 border-t-blue-500 shadow-sm">
           <CardHeader className="pb-3 bg-muted/10">
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <Clock className="w-4 h-4 text-blue-500" /> Agendamentos de Hoje
             </CardTitle>
             <CardDescription className="text-xs">
               Apenas para acompanhamento rápido do dia.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-4">
             {renderList(categories.todayList, "Agenda livre hoje.", 'today')}
           </CardContent>
         </Card>

         <Card className="border-t-4 border-t-green-500 shadow-sm">
           <CardHeader className="pb-3 bg-muted/10">
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <History className="w-4 h-4 text-green-500" /> Aniversário da Tattoo (1 ano)
             </CardTitle>
             <CardDescription className="text-xs">
               Clientes que tatuaram com você exatamente hoje há 1 ano atrás. Chame para um novo projeto!
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-4">
             {renderList(categories.oneYearList, "Nenhuma tatuagem fez 1 ano hoje.", '1year')}
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
