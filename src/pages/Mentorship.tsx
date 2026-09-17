import { Target, Users, Calendar, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Mentorship = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Mentorias Luizart</h1>
          <p className="page-subtitle">Acompanhamento exclusivo, sessões 1 a 1 e desenvolvimento de artistas.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Turma / Mentorado
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border shadow-sm p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[250px] border-dashed border-2 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Novo Mentorado</h3>
            <p className="text-sm text-muted-foreground mt-1">Cadastre um novo artista para acompanhamento.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mentorship;
