import { useState, useEffect } from "react";
import { Plus, Users, Settings, Globe, Hammer, CheckCircle2, ChevronRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Courses = () => {
  const [activeTab, setActiveTab] = useState("presencial");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Cursos Luizart</h1>
          <p className="page-subtitle">Gestão de turmas presenciais, produção e plataforma online.</p>
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
              Turmas Presenciais
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
              <h2 className="text-xl font-bold text-foreground">Próximas Turmas</h2>
              <Button className="gap-2 rounded-full h-10 px-5 shadow-md">
                <Plus className="h-4 w-4" />
                Nova Turma
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-2xl border shadow-sm p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[250px] border-dashed border-2 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Abrir Primeira Turma</h3>
                  <p className="text-sm text-muted-foreground mt-1">Configure a data, local e valores da sua aula presencial.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="producao" className="m-0 space-y-6">
             <div className="bg-card rounded-2xl border shadow-sm p-8 text-center space-y-4">
               <div className="h-16 w-16 mx-auto rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                 <Settings className="h-8 w-8" />
               </div>
               <h3 className="text-xl font-bold text-foreground">Organograma do Curso</h3>
               <p className="text-muted-foreground max-w-md mx-auto">
                 Aqui você poderá criar o Playbook do seu curso, roteiros e checklist do que precisa ser levado para o presencial.
               </p>
               <Button variant="outline" className="mt-4">Criar Playbook</Button>
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
    </div>
  );
};

export default Courses;
