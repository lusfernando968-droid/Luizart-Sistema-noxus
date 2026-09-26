import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, UserPlus, Users, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Partner {
  id: string;
  name: string;
  phone: string;
  style: string;
}

const Settings = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerPhone, setNewPartnerPhone] = useState("");
  const [newPartnerStyle, setNewPartnerStyle] = useState("");

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Erro ao buscar parceiros:", error);
      toast.error("Erro ao carregar lista de parceiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleAddPartner = async () => {
    if (!newPartnerName || !newPartnerPhone || !newPartnerStyle) {
      toast.error("Preencha todos os campos.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('partners').insert([{
        name: newPartnerName,
        phone: newPartnerPhone,
        style: newPartnerStyle
      }]);

      if (error) throw error;

      toast.success("Parceiro adicionado com sucesso!");
      setIsAddModalOpen(false);
      setNewPartnerName("");
      setNewPartnerPhone("");
      setNewPartnerStyle("");
      await fetchPartners();
    } catch (error) {
      console.error("Erro ao adicionar parceiro:", error);
      toast.error("Erro ao adicionar parceiro.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este parceiro?")) return;
    
    try {
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
      toast.success("Parceiro removido.");
      await fetchPartners();
    } catch (error) {
      console.error("Erro ao remover parceiro:", error);
      toast.error("Erro ao remover parceiro.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-primary" /> Configuração do Sistema
          </h1>
          <p className="page-subtitle">Gerencie as preferências gerais e cadastros auxiliares do sistema</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm text-foreground overflow-hidden">
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Users className="w-5 h-5" /> Tatuadores Parceiros (Indicações)
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 bg-primary text-primary-foreground font-bold shadow-md">
            <UserPlus className="h-4 w-4" />
            Adicionar Parceiro
          </Button>
        </div>
        
        <div className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nome do Parceiro</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Estilo de Trabalho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Carregando parceiros...</TableCell>
                </TableRow>
              ) : partners.length > 0 ? (
                partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-bold">{partner.name}</TableCell>
                    <TableCell className="text-muted-foreground">{partner.phone}</TableCell>
                    <TableCell><span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-xs font-semibold">{partner.style}</span></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePartner(partner.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nenhum parceiro cadastrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Novo Parceiro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input 
                placeholder="Ex: Carlos Eduardo" 
                value={newPartnerName} 
                onChange={(e) => setNewPartnerName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input 
                placeholder="Ex: (11) 99999-9999" 
                value={newPartnerPhone} 
                onChange={(e) => setNewPartnerPhone(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Estilo de Trabalho</Label>
              <Input 
                placeholder="Ex: Realismo, Fineline..." 
                value={newPartnerStyle} 
                onChange={(e) => setNewPartnerStyle(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddPartner} disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar Parceiro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
