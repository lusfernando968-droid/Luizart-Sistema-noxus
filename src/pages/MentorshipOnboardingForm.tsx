import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Building2,
  UserCheck
} from "lucide-react";

const LEVELS = ["Iniciante", "Intermediário", "Avançado", "Especialista"];

export default function MentorshipOnboardingForm() {
  const { clientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [clientData, setClientData] = useState<any>(null);

  const [formData, setFormData] = useState({
    level: "Intermediário",
    specialty: "",
    city_studio: "",
    initial_revenue: 0,
    target_revenue: 0,
    main_goal: "",
    strengths: "",
    weaknesses: "",
    general_notes: ""
  });

  useEffect(() => {
    const fetchMenteeData = async () => {
      if (!clientId) return;

      try {
        const { data: client, error: clientError } = await supabase
          .from("clientes")
          .select("*")
          .eq("id", clientId)
          .single();

        if (clientError || !client) {
          setErrorMsg("Mentorado não encontrado ou link inválido.");
          return;
        }

        setClientData(client);

        const { data: profile } = await supabase
          .from("mentorship_profiles")
          .select("*")
          .eq("client_id", clientId)
          .maybeSingle();

        if (profile) {
          setFormData({
            level: profile.level || "Intermediário",
            specialty: profile.specialty || "",
            city_studio: profile.city_studio || "",
            initial_revenue: Number(profile.initial_revenue || 0),
            target_revenue: Number(profile.target_revenue || 0),
            main_goal: profile.main_goal || "",
            strengths: profile.strengths || "",
            weaknesses: profile.weaknesses || "",
            general_notes: profile.general_notes || ""
          });
        }
      } catch (err) {
        console.error("Erro ao carregar ficha:", err);
        setErrorMsg("Erro ao carregar o formulário.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenteeData();
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.specialty.trim() || !formData.main_goal.trim()) {
      alert("Por favor, preencha sua especialidade e seu objetivo principal na mentoria.");
      return;
    }

    try {
      setSubmitting(true);

      const { data: existingProfile } = await supabase
        .from("mentorship_profiles")
        .select("current_revenue, status, start_date, next_meeting_date")
        .eq("client_id", clientId)
        .maybeSingle();

      const today = new Date().toISOString().split("T")[0];

      const payload = {
        client_id: clientId,
        status: existingProfile?.status || "Ativo",
        level: formData.level,
        specialty: formData.specialty.trim(),
        city_studio: formData.city_studio.trim(),
        initial_revenue: Number(formData.initial_revenue || 0),
        current_revenue:
          Number(existingProfile?.current_revenue || 0) > 0
            ? Number(existingProfile.current_revenue)
            : Number(formData.initial_revenue || 0),
        target_revenue: Number(formData.target_revenue || 0),
        main_goal: formData.main_goal.trim(),
        strengths: formData.strengths.trim(),
        weaknesses: formData.weaknesses.trim(),
        general_notes: formData.general_notes.trim(),
        start_date: existingProfile?.start_date || today,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("mentorship_profiles")
        .upsert(payload, { onConflict: "client_id" });

      if (error) throw error;

      await supabase
        .from("clientes")
        .update({ is_student: true })
        .eq("id", clientId);

      setSuccess(true);
    } catch (err) {
      console.error("Erro ao salvar ficha de mentoria:", err);
      alert("Não foi possível salvar os dados. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="bg-card border p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-14 h-14 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">{errorMsg}</h2>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="bg-card border p-8 rounded-2xl max-w-md w-full text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">Ficha de Diagnóstico Salva!</h2>
          <p className="text-sm text-muted-foreground">
            Seus dados foram vinculados diretamente ao seu dossiê de mentoria.
          </p>
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => setSuccess(false)}
          >
            Revisar ou Atualizar Dados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" /> Mentoria Luizart
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ficha de Diagnóstico do Mentorado
          </h1>
        </div>

        <div className="bg-card border shadow-xl rounded-2xl overflow-hidden text-left">
          {/* Cabeçalho de Identificação */}
          <div className="p-5 sm:p-6 bg-accent/20 border-b grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Programa
              </p>
              <p className="font-bold text-sm text-foreground">Mentoria Individual Luizart</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-primary" /> Mentorado(a)
              </p>
              <p className="font-bold text-sm text-foreground">{clientData?.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* 1. Perfil Artístico */}
            <div className="space-y-4">
              <h3 className="text-base font-bold border-b pb-2 text-foreground">
                1. Perfil Artístico & Estrutura
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nível de Experiência Atual</Label>
                  <Select
                    value={formData.level}
                    onValueChange={val => setFormData({ ...formData, level: val })}
                  >
                    <SelectTrigger className="h-11 bg-accent/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map(lv => (
                        <SelectItem key={lv} value={lv}>
                          {lv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Estilo / Especialidade Principal</Label>
                  <Input
                    className="h-11 bg-accent/10"
                    placeholder="Ex: Realismo, Blackwork, Fine Line..."
                    value={formData.specialty}
                    onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Cidade & Formato de Estúdio</Label>
                  <Input
                    className="h-11 bg-accent/10"
                    placeholder="Ex: São Paulo/SP — Estúdio Privado"
                    value={formData.city_studio}
                    onChange={e => setFormData({ ...formData, city_studio: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 2. Momento Financeiro */}
            <div className="space-y-4">
              <h3 className="text-base font-bold border-b pb-2 text-foreground">
                2. Momento Financeiro & Metas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Faturamento Médio Mensal Atual (R$)</Label>
                  <CurrencyInput
                    className="h-11 bg-accent/10"
                    value={formData.initial_revenue}
                    onValueChange={val => setFormData({ ...formData, initial_revenue: val })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Meta de Faturamento Mensal (R$)</Label>
                  <CurrencyInput
                    className="h-11 bg-accent/10"
                    value={formData.target_revenue}
                    onValueChange={val => setFormData({ ...formData, target_revenue: val })}
                  />
                </div>
              </div>
            </div>

            {/* 3. Diagnóstico Estratégico */}
            <div className="space-y-4">
              <h3 className="text-base font-bold border-b pb-2 text-foreground">
                3. Diagnóstico & Objetivos
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Objetivo Principal com a Mentoria</Label>
                <Input
                  className="h-11 bg-accent/10"
                  placeholder="Ex: Dominar fechamento de grandes projetos e dobrar o faturamento"
                  value={formData.main_goal}
                  onChange={e => setFormData({ ...formData, main_goal: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Seus Principais Pontos Fortes</Label>
                  <Textarea
                    rows={4}
                    className="bg-accent/10"
                    placeholder="O que você já domina bem hoje?"
                    value={formData.strengths}
                    onChange={e => setFormData({ ...formData, strengths: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Principais Dificuldades / Gargalos</Label>
                  <Textarea
                    rows={4}
                    className="bg-accent/10"
                    placeholder="Técnica, vendas, posicionamento no Instagram, precificação..."
                    value={formData.weaknesses}
                    onChange={e => setFormData({ ...formData, weaknesses: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contexto Adicional / Equipamentos</Label>
                <Textarea
                  rows={3}
                  className="bg-accent/10"
                  placeholder="Tempo de profissão, máquinas utilizadas, rotina atual..."
                  value={formData.general_notes}
                  onChange={e => setFormData({ ...formData, general_notes: e.target.value })}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 font-bold text-base"
            >
              {submitting ? "Salvando Diagnóstico..." : "Concluir e Enviar Ficha"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
