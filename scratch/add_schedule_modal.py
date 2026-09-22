import re

with open('src/pages/Courses.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add new imports if not present
imports = """import { useState, useEffect } from "react";
import { Plus, Users, Settings, Globe, Hammer, CheckCircle2, ChevronRight, Video, Calendar as CalendarIcon, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";"""

# Replace all imports at the top
content = re.sub(r'import \{ useState, useEffect \} from "react";.*?import \{ Label \} from "@/components/ui/label";', imports, content, flags=re.DOTALL)

# 2. Add State and Functions inside Courses component
state_code = """const Courses = () => {
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
"""

content = re.sub(r'const Courses = \(\) => \{\n  const \[activeTab, setActiveTab\] = useState\("presencial"\);', state_code, content)

# 3. Update the Button to open modal
button_pattern = r'(<Button className="gap-2 rounded-full h-10 px-5 shadow-md">)'
content = re.sub(button_pattern, r'<Button className="gap-2 rounded-full h-10 px-5 shadow-md" onClick={() => setIsScheduleModalOpen(true)}>', content)

# 4. Add the Dialog at the end of the return statement
dialog_code = """
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
};"""

content = re.sub(r'    </div>\n  \);\n\};\n\nexport default Courses;', dialog_code + '\n\nexport default Courses;', content)

with open('src/pages/Courses.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Courses.tsx modal implemented")
