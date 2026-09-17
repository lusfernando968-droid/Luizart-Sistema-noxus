import { useState, useEffect } from "react";
import { Plus, Users, Settings, Globe, Hammer, CheckCircle2, ChevronRight, Video, Calendar as CalendarIcon, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Courses = () => {
  const [activeTab, setActiveTab] = useState("presencial");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("1");
  const pricePerHour = 50;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clientes').select('id, name').order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const calculateEndTime = (start: string, hours: number) => {
    if (!start) return "";
    const [h, m] = start.split(":");
    const endH = parseInt(h) + hours;
    return `${endH.toString().padStart(2, '0')}:${m}`;
  };

  const handleSchedule = async () => {
    if (!clientId || !date || !startTime || !duration) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const hours = parseInt(duration);
      const totalValue = hours * pricePerHour;
      const endTime = calculateEndTime(startTime, hours);

      const { error } = await supabase.from('appointments').insert({
        client_id: clientId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        type: "Aula Presencial",
        status: "Agendado",
        value: totalValue,
        notes: `Aula Presencial 1 a 1 (${hours}h)`
      });

      if (error) throw error;

      toast.success("Aula agendada com sucesso!");
      setIsScheduleModalOpen(false);
      // Reset form
      setClientId("");
      setDate("");
      setStartTime("");
      setDuration("1");
    } catch (error) {
      console.error("Erro ao agendar:", error);
      toast.error("Erro ao agendar aula");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Cursos Luizart</h1>
          <p className="page-subtitle">Gestão de aulas presenciais 1 a 1, playbook e plataforma online.</p>
        </div>
      </div>

      <Tabs defaultValue="presencial" className="w-full" onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
          <TabsList className="bg-transparent space-x-2 p-0 h-auto w-max min-w-full sm:min-w-0">
            <TabsTrigger 
              value="presencial"
              className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-accent/50 text-foreground border shadow-sm transition-all text-sm font-medium whitespace-nowrap"
            >
              <Users className="w-4 h-4 mr-2" />
              Aulas Individuais
            </TabsTrigger>
            <TabsTrigger 
              value="producao"
              className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-accent/50 text-foreground border shadow-sm transition-all text-sm font-medium whitespace-nowrap"
            >
              <Settings className="w-4 h-4 mr-2" />
              Bastidores (Produção)
            </TabsTrigger>
            <TabsTrigger 
              value="online"
              className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-accent/50 text-foreground border shadow-sm transition-all text-sm font-medium whitespace-nowrap"
            >
              <Globe className="w-4 h-4 mr-2" />
              Plataforma Online
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="presencial" className="m-0 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Aulas Presenciais (1 a 1)</h2>
                <p className="text-sm text-muted-foreground">R$ 50/hora • Foco prático • Transição para Mentoria</p>
              </div>
              <Button className="gap-2 rounded-full h-10 px-5 shadow-md" onClick={() => setIsScheduleModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Agendar Aula
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-2xl border shadow-sm p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[250px] border-dashed border-2 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Novo Aluno Presencial</h3>
                  <p className="text-sm text-muted-foreground mt-1">Agende a primeira aula prática de traço.</p>
                </div>
              </div>
            </div>
</TabsContent>

          <TabsContent value="producao" className="m-0 space-y-6">
             <div className="bg-card rounded-2xl border shadow-sm p-8 text-left space-y-6">
               <div className="flex items-center gap-4 border-b pb-4">
                 <div className="h-16 w-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                   <CheckCircle2 className="h-8 w-8" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-foreground">Playbook & Metodologia</h3>
                   <p className="text-muted-foreground">Roteiro técnico direto ao ponto para alunos iniciantes.</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Etapas da Aula 1 a 1</h4>
                   <ul className="space-y-3">
                     <li className="flex items-start gap-3 text-sm"><div className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div></div> <span><strong className="text-foreground">Entrega do Script:</strong> Biossegurança e Montagem de Máquina (Leitura autônoma).</span></li>
                     <li className="flex items-start gap-3 text-sm"><div className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div></div> <span><strong className="text-foreground">Prática Imediata:</strong> Quebrar o medo da máquina. Foco total no traço.</span></li>
                     <li className="flex items-start gap-3 text-sm"><div className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div></div> <span><strong className="text-foreground">Avaliação:</strong> Análise de profundidade e consistência do traço.</span></li>
                     <li className="flex items-start gap-3 text-sm"><div className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div></div> <span><strong className="text-foreground">Transição:</strong> Pele artificial vs Pele real.</span></li>
                   </ul>
                 </div>
                 
                 <div className="space-y-4 bg-muted/30 p-5 rounded-xl border">
                   <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">Funil de Crescimento</h4>
                   <p className="text-sm text-muted-foreground">As aulas presenciais são rápidas e focadas na base. Após o aluno dominar a máquina, o objetivo é transferi-lo para a <strong>Mentoria</strong> de longo prazo.</p>
                   <Button variant="outline" className="w-full mt-2 gap-2 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/10">
                     Ver Alunos Prontos p/ Mentoria <ChevronRight className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </div>
</TabsContent>

          <TabsContent value="online" className="m-0 space-y-6">
             <div className="bg-card rounded-2xl border shadow-sm p-12 text-center space-y-5">
               <div className="h-20 w-20 mx-auto rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center relative overflow-hidden group">
                 <Hammer className="h-10 w-10 relative z-10 animate-bounce" />
               </div>
               
               <h3 className="text-2xl font-bold text-foreground">Plataforma Online em Construção</h3>
               <p className="text-muted-foreground max-w-lg mx-auto text-base">
                 Chefe, este espaço está reservado para a integração via <strong className="text-foreground">API</strong> com o seu site independente. 
                 No futuro, você controlará acessos, aulas virtuais e vendas por WhatsApp diretamente daqui.
               </p>
               
               <div className="flex items-center justify-center gap-6 pt-4 opacity-50">
                 <div className="flex flex-col items-center gap-2">
                   <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"><Globe className="h-5 w-5" /></div>
                   <span className="text-xs font-medium">Site Externo</span>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                   <span className="text-[10px] font-bold tracking-widest uppercase">API</span>
                   <div className="h-0.5 w-16 bg-border relative">
                     <ChevronRight className="absolute -right-2 -top-2 h-4 w-4 text-border" />
                   </div>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center"><Video className="h-5 w-5" /></div>
                   <span className="text-xs font-medium">Painel Luizart</span>
                 </div>
               </div>
             </div>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Aula Individual</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Aluno</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="date" className="pl-9" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Início</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="time" className="pl-9" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Duração (Horas)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hora (R$ 50)</SelectItem>
                  <SelectItem value="2">2 Horas (R$ 100)</SelectItem>
                  <SelectItem value="3">3 Horas (R$ 150)</SelectItem>
                  <SelectItem value="4">4 Horas (R$ 200)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-accent/30 p-3 rounded-lg flex items-center justify-between border mt-2">
              <span className="text-sm font-medium">Valor Total:</span>
              <span className="text-lg font-bold text-primary">R$ {(parseInt(duration) * 50).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSchedule} disabled={loading}>
              {loading ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;
